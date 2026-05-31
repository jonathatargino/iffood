#!/usr/bin/env node
'use strict';

/**
 * analyze-c3b-worker.js
 *
 * Pós-processamento do c3b-async: espera esvaziar a fila SQS, cruza logs ENQUEUE
 * do k6 com order_requests no PostgreSQL e calcula latência end-to-end de negócio.
 *
 * Chamado automaticamente pelo run-all.sh após c3b (inclui run-one.sh c3b).
 *
 *   node load-tests/analyze-c3b-worker.js --dir=load-tests/results/20260530T221839
 *
 * Variáveis:
 *   DB_URL                    — obrigatório
 *   SQS_QUEUE_URL             — opcional (poll de drain; pula se ausente)
 *   K6_WORKER_DRAIN_SEC       — tempo máx. de espera da fila (padrão: 900)
 *   K6_WORKER_DRAIN_POLL_SEC  — intervalo de poll SQS (padrão: 5)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  /* ok */
}
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.k6') });
} catch {
  /* ok */
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=')];
  }),
);

const RESULTS_DIR = args.dir;
const WINDOWS_FILE = args.windows || (RESULTS_DIR ? path.join(RESULTS_DIR, 'test-windows.json') : '');
const K6_LOG = args['k6-log'] || (RESULTS_DIR ? path.join(RESULTS_DIR, 'c3b-async.k6.log') : '');
const OUT_FILE = args.out || (RESULTS_DIR ? path.join(RESULTS_DIR, 'c3b-worker-analysis.json') : '');

const DB_URL = process.env.DB_URL || '';
const SQS_URL = process.env.SQS_QUEUE_URL || '';
const MAX_DRAIN_SEC = parseInt(process.env.K6_WORKER_DRAIN_SEC || '900', 10);
const POLL_SEC = parseInt(process.env.K6_WORKER_DRAIN_POLL_SEC || '5', 10);
const CHUNK_SIZE = 2000;

const ENQUEUE_RE = /^ENQUEUE cartId=([^\s]+) ts=(\d+) vu=(\d+)/;

function round(n, d = 2) {
  if (n == null || Number.isNaN(n)) return null;
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function summarizeLatencies(values) {
  if (!values.length) {
    return { samples: 0, avg: null, min: null, med: null, 'p(90)': null, 'p(95)': null, 'p(99)': null, max: null };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  return {
    samples: sorted.length,
    avg: round(sum / sorted.length),
    min: round(sorted[0]),
    med: round(percentile(sorted, 50)),
    'p(90)': round(percentile(sorted, 90)),
    'p(95)': round(percentile(sorted, 95)),
    'p(99)': round(percentile(sorted, 99)),
    max: round(sorted[sorted.length - 1]),
  };
}

function parseEnqueueLog(filePath) {
  if (!fs.existsSync(filePath)) {
    return { events: [], byCartId: new Map(), duplicates: 0 };
  }

  const events = [];
  const byCartId = new Map();
  let duplicates = 0;

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const m = line.match(ENQUEUE_RE);
    if (!m) continue;
    const cartId = m[1];
    const ts = Number(m[2]);
    const vu = Number(m[3]);
    if (byCartId.has(cartId)) {
      duplicates += 1;
      continue;
    }
    const event = { cartId, enqueue_ts_ms: ts, vu };
    byCartId.set(cartId, event);
    events.push(event);
  }

  return { events, byCartId, duplicates };
}

function loadK6Summary(resultsDir) {
  const summaryPath = path.join(resultsDir, 'c3b-async.json');
  if (!fs.existsSync(summaryPath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const metrics = raw.metrics || {};
    const http = metrics.http_reqs?.values || metrics.http_reqs || {};
    const asyncReqs = metrics.async_order_requests?.values || metrics.async_order_requests || {};
    return {
      http_requests: http.count ?? null,
      async_order_requests: asyncReqs.count ?? null,
    };
  } catch {
    return null;
  }
}

function loadC3bWindow(windowsFile) {
  if (!fs.existsSync(windowsFile)) return null;
  const windows = JSON.parse(fs.readFileSync(windowsFile, 'utf8'));
  return windows.tests?.['c3b-async'] || null;
}

async function getQueueDepth(sqs) {
  const res = await sqs
    .getQueueAttributes({
      QueueUrl: SQS_URL,
      AttributeNames: [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
        'ApproximateNumberOfMessagesDelayed',
      ],
    })
    .promise();

  const visible = parseInt(res.Attributes?.ApproximateNumberOfMessages || '0', 10);
  const inflight = parseInt(res.Attributes?.ApproximateNumberOfMessagesNotVisible || '0', 10);
  const delayed = parseInt(res.Attributes?.ApproximateNumberOfMessagesDelayed || '0', 10);
  return { visible, inflight, delayed, total: visible + inflight + delayed };
}

async function waitForQueueDrain() {
  if (!SQS_URL) {
    return {
      enabled: false,
      drained: null,
      waited_sec: 0,
      note: 'SQS_QUEUE_URL não definido — pulando poll de drain',
    };
  }

  const AWS = require('aws-sdk');
  const region =
    process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';
  const sqs = new AWS.SQS({
    region,
    ...(SQS_URL.includes('localhost') || SQS_URL.includes('127.0.0.1')
      ? { endpoint: new URL(SQS_URL).origin, s3ForcePathStyle: true }
      : {}),
  });

  const started = Date.now();
  const at_start = await getQueueDepth(sqs);
  let last = at_start;
  let polls = 1;

  while ((Date.now() - started) / 1000 < MAX_DRAIN_SEC) {
    if (last.total === 0) {
      return {
        enabled: true,
        drained: true,
        waited_sec: round((Date.now() - started) / 1000, 1),
        polls,
        at_start,
        at_end: last,
      };
    }
    await sleep(POLL_SEC * 1000);
    last = await getQueueDepth(sqs);
    polls += 1;
  }

  return {
    enabled: true,
    drained: false,
    waited_sec: MAX_DRAIN_SEC,
    polls,
    at_start,
    at_end: last,
    note: `Fila não esvaziou em ${MAX_DRAIN_SEC}s`,
  };
}

async function fetchOrdersByCartIds(client, cartIds) {
  const rows = [];
  for (let i = 0; i < cartIds.length; i += CHUNK_SIZE) {
    const chunk = cartIds.slice(i, i + CHUNK_SIZE);
    const res = await client.query(
      `SELECT cart_id,
              EXTRACT(EPOCH FROM created_at) * 1000 AS created_at_ms,
              status
       FROM order_requests
       WHERE cart_id = ANY($1::text[])`,
      [chunk],
    );
    rows.push(...res.rows);
  }
  return rows;
}

async function countOrdersInWindow(client, startMs, endMs) {
  const res = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM order_requests
     WHERE created_at >= to_timestamp($1 / 1000.0)
       AND created_at <= to_timestamp($2 / 1000.0)`,
    [startMs, endMs],
  );
  return res.rows[0]?.count ?? 0;
}

async function main() {
  if (!RESULTS_DIR) {
    console.error('[analyze-c3b-worker] --dir é obrigatório.');
    process.exit(1);
  }
  if (!DB_URL) {
    console.error('[analyze-c3b-worker] DB_URL não definido — análise abortada.');
    process.exit(1);
  }

  const window = loadC3bWindow(WINDOWS_FILE);
  if (!window?.started_at_epoch_ms || !window?.ended_at_epoch_ms) {
    console.error('[analyze-c3b-worker] Janela c3b ausente em test-windows.json.');
    process.exit(1);
  }

  const k6Summary = loadK6Summary(RESULTS_DIR);
  const { events, byCartId, duplicates } = parseEnqueueLog(K6_LOG);

  console.log(
    `[analyze-c3b-worker] ENQUEUE no log: ${events.length}` +
      (duplicates ? ` (${duplicates} duplicados ignorados)` : ''),
  );

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  let persistedAtK6End = null;
  try {
    persistedAtK6End = await countOrdersInWindow(
      client,
      window.started_at_epoch_ms,
      window.ended_at_epoch_ms,
    );
    console.log(`[analyze-c3b-worker] Persistidos durante k6: ${persistedAtK6End}`);
  } catch (err) {
    console.warn(`[analyze-c3b-worker] Snapshot durante k6 falhou: ${err.message}`);
  }

  console.log(
    `[analyze-c3b-worker] Aguardando drain SQS (máx ${MAX_DRAIN_SEC}s, poll ${POLL_SEC}s)...`,
  );
  const sqsDrain = await waitForQueueDrain();
  if (sqsDrain.drained === true) {
    console.log(`[analyze-c3b-worker] Fila esvaziada em ${sqsDrain.waited_sec}s`);
  } else if (sqsDrain.enabled) {
    console.warn(
      `[analyze-c3b-worker] Fila ainda com ${sqsDrain.at_end?.total ?? '?'} mensagens após espera`,
    );
  } else {
    console.warn(`[analyze-c3b-worker] ${sqsDrain.note}`);
  }

  const analysisEndedMs = Date.now();
  let rows = [];
  try {
    if (events.length > 0) {
      rows = await fetchOrdersByCartIds(client, events.map((e) => e.cartId));
    } else {
      console.warn('[analyze-c3b-worker] Log ENQUEUE vazio — usando janela temporal no banco.');
      const res = await client.query(
        `SELECT cart_id,
                EXTRACT(EPOCH FROM created_at) * 1000 AS created_at_ms,
                status
         FROM order_requests
         WHERE created_at >= to_timestamp($1 / 1000.0)
           AND created_at <= to_timestamp($2 / 1000.0)`,
        [window.started_at_epoch_ms, analysisEndedMs],
      );
      rows = res.rows;
    }
  } finally {
    await client.end();
  }

  const rowByCart = new Map(rows.map((r) => [r.cart_id, r]));
  const businessLatencies = [];
  const postK6Latencies = [];
  let missingAfterDrain = 0;

  for (const event of events) {
    const row = rowByCart.get(event.cartId);
    if (!row) {
      missingAfterDrain += 1;
      continue;
    }
    const businessMs = Number(row.created_at_ms) - event.enqueue_ts_ms;
    businessLatencies.push(businessMs);
    if (Number(row.created_at_ms) > window.ended_at_epoch_ms) {
      postK6Latencies.push(Number(row.created_at_ms) - window.ended_at_epoch_ms);
    }
  }

  const enqueuedK6 = k6Summary?.async_order_requests ?? k6Summary?.http_requests ?? null;
  const persistedTotal = rows.length;

  const output = {
    generated_at: new Date().toISOString(),
    test_name: 'c3b-async',
    k6_window: {
      started_at: window.started_at,
      ended_at: window.ended_at,
      started_at_epoch_ms: window.started_at_epoch_ms,
      ended_at_epoch_ms: window.ended_at_epoch_ms,
      duration_ms: window.duration_ms,
    },
    analysis_ended_at: new Date(analysisEndedMs).toISOString(),
    analysis_ended_at_epoch_ms: analysisEndedMs,
    enqueue: {
      k6_async_requests: enqueuedK6,
      logged_enqueues: events.length,
      duplicate_log_lines: duplicates,
      k6_log: path.basename(K6_LOG),
    },
    sqs_drain: sqsDrain,
    persistence: {
      persisted_during_k6: persistedAtK6End,
      persisted_total: persistedTotal,
      persisted_matched_to_log: businessLatencies.length,
      missing_after_drain: events.length ? missingAfterDrain : null,
      backlog_estimate_at_k6_end:
        enqueuedK6 != null && persistedAtK6End != null
          ? Math.max(0, enqueuedK6 - persistedAtK6End)
          : null,
    },
    total_business_latency_ms: summarizeLatencies(businessLatencies),
    post_k6_drain_latency_ms: summarizeLatencies(postK6Latencies),
    notes: [
      'total_business_latency_ms = order_requests.created_at − ts do log ENQUEUE (202 aceito).',
      'post_k6_drain_latency_ms = created_at − fim do k6 (tempo extra na fila/worker após o teste).',
      'Compare com c3a via sync_order_processing_ms / latência HTTP — mesma lógica de negócio no worker.',
    ],
  };

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`[analyze-c3b-worker] Salvo: ${OUT_FILE}`);

  if (output.total_business_latency_ms.samples > 0) {
    const b = output.total_business_latency_ms;
    console.log(
      `[analyze-c3b-worker] Latência end-to-end: med=${b.med}ms p95=${b['p(95)']}ms max=${b.max}ms (${b.samples} amostras)`,
    );
  }
}

main().catch((err) => {
  console.error('[analyze-c3b-worker] Erro fatal:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
