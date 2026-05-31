#!/usr/bin/env node
'use strict';

/**
 * analyze-c3b-worker.js
 *
 * Pós-processamento do c3b-async: espera esvaziar a fila SQS, cruza logs ENQUEUE
 * do k6 com order_requests no PostgreSQL e calcula latência end-to-end de negócio
 * (global e por perfil de VU: 50, 100, …, 400).
 *
 * Chamado automaticamente pelo run-all.sh após c3b (inclui run-one.sh c3b).
 *
 *   node load-tests/analyze-c3b-worker.js --dir=load-tests/results/20260530T221839
 *
 * Variáveis:
 *   DB_URL                    — obrigatório
 *   SQS_QUEUE_URL             — opcional (poll de drain; pula se ausente)
 *   K6_WORKER_DRAIN_MODE      — skip | bounded | full (padrão: skip)
 *     skip    — não espera SQS; cruza log+PG imediatamente (use com purge pós-teste)
 *     bounded — espera até K6_WORKER_DRAIN_SEC e cruza o que existir no PG
 *     full    — espera fila esvaziar ou timeout longo (900s)
 *   K6_WORKER_DRAIN_SEC       — grace period em bounded (padrão: 60)
 *   K6_WORKER_DRAIN_POLL_SEC  — intervalo de poll SQS (padrão: 5)
 *   K6_WORKER_PG_RETRY_MAX    — tentativas de conexão/query no PG (padrão: 15)
 *   K6_WORKER_PG_RETRY_SEC    — espera base entre tentativas (padrão: 12)
 *   K6_WORKER_PG_RETRY_BACKOFF — 0 desliga backoff linear (padrão: ligado, teto 60s)
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
const DRAIN_MODE = (
  args['drain-mode'] ||
  process.env.K6_WORKER_DRAIN_MODE ||
  'skip'
).toLowerCase();
const MAX_DRAIN_SEC = parseInt(
  args['drain-sec'] ||
    process.env.K6_WORKER_DRAIN_SEC ||
    (DRAIN_MODE === 'full' ? '900' : '60'),
  10,
);
const POLL_SEC = parseInt(process.env.K6_WORKER_DRAIN_POLL_SEC || '5', 10);
const PG_RETRY_MAX = parseInt(
  args['pg-retry-max'] || process.env.K6_WORKER_PG_RETRY_MAX || '15',
  10,
);
const PG_RETRY_WAIT_SEC = parseInt(
  args['pg-retry-sec'] || process.env.K6_WORKER_PG_RETRY_SEC || '12',
  10,
);
const PG_RETRY_BACKOFF = process.env.K6_WORKER_PG_RETRY_BACKOFF !== '0';
const CHUNK_SIZE = 2000;

// k6 envolve console.log: time="..." level=info msg="ENQUEUE cartId=... ts=... vu=..."
const ENQUEUE_RE = /ENQUEUE cartId=([^\s"']+)\s+ts=(\d+)\s+vu=(\d+)/;

function round(n, d = 2) {
  if (n == null || Number.isNaN(n)) return null;
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPgRetryableError(err) {
  if (!err) return false;
  const code = String(err.code || '').toUpperCase();
  const msg = String(err.message || '').toLowerCase();
  const full = `${code} ${msg}`.toLowerCase();
  return (
    code === '53300'
    || code === '57P03'
    || code === '08006'
    || code === '08001'
    || code === '08003'
    || code === 'ETIMEDOUT'
    || code === 'ECONNREFUSED'
    || code === 'ECONNRESET'
    || code === 'EMAXCONNSESSION'
    || full.includes('too many clients')
    || full.includes('too many connections')
    || full.includes('max clients reached')
    || full.includes('max clients are limited')
    || full.includes('emaxconnsession')
    || full.includes('pool_size')
    || full.includes('session mode')
    || full.includes('remaining connection slots')
    || full.includes('connection terminated')
    || full.includes('connection timeout')
    || full.includes('connect econnrefused')
    || full.includes('timeout expired')
    || full.includes('could not connect')
  );
}

function pgRetryWaitSec(attempt) {
  if (!PG_RETRY_BACKOFF) return PG_RETRY_WAIT_SEC;
  return Math.min(PG_RETRY_WAIT_SEC * attempt, 60);
}

function logPgRetryBanner(attempt, err, context) {
  const waitSec = pgRetryWaitSec(attempt);
  const nextAttempt = attempt + 1;
  const lines = [
    '',
    '[analyze-c3b-worker] ═══════════════════════════════════════════════════════',
    `[analyze-c3b-worker] PostgreSQL indisponível — ${context} (tentativa ${attempt}/${PG_RETRY_MAX})`,
    `[analyze-c3b-worker] Erro: ${err.message}`,
    '[analyze-c3b-worker] Provável pool saturado (worker ~10 conn + API + limite Supabase ~15).',
    '[analyze-c3b-worker] Ações possíveis enquanto aguarda:',
    '[analyze-c3b-worker]   • pausar/parar o worker NestJS',
    '[analyze-c3b-worker]   • purge na fila SQS (após o k6; reduz carga nova no PG)',
    '[analyze-c3b-worker]   • encerrar sessões idle no painel do banco (Supabase → Database)',
    nextAttempt <= PG_RETRY_MAX
      ? `[analyze-c3b-worker] Próxima tentativa ${nextAttempt}/${PG_RETRY_MAX} em ${waitSec}s...`
      : '[analyze-c3b-worker] Tentativas esgotadas — análise abortada.',
    '[analyze-c3b-worker] ═══════════════════════════════════════════════════════',
    '',
  ];
  for (const line of lines) console.log(line);
  return waitSec;
}

async function waitPgRetry(attempt, err, context) {
  const waitSec = logPgRetryBanner(attempt, err, context);
  await sleep(waitSec * 1000);
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

async function fetchOrdersInWindow(client, startMs, endMs) {
  const res = await client.query(
    `SELECT cart_id,
            EXTRACT(EPOCH FROM created_at) * 1000 AS created_at_ms,
            status
     FROM order_requests
     WHERE created_at >= to_timestamp($1 / 1000.0)
       AND created_at <= to_timestamp($2 / 1000.0)`,
    [startMs, endMs],
  );
  return res.rows;
}

async function collectPgAnalysisData({ events, window }) {
  let lastErr;
  for (let attempt = 1; attempt <= PG_RETRY_MAX; attempt++) {
    let client;
    try {
      if (attempt > 1) {
        console.log(
          `[analyze-c3b-worker] Retomando coleta no PostgreSQL (tentativa ${attempt}/${PG_RETRY_MAX})...`,
        );
      }

      client = createPgClient();
      console.log(
        `[analyze-c3b-worker] Conectando PostgreSQL (tentativa ${attempt}/${PG_RETRY_MAX})...`,
      );
      await client.connect();
      if (attempt > 1) {
        console.log('[analyze-c3b-worker] PostgreSQL conectado.');
      }

      let persistedAtK6End = null;
      try {
        persistedAtK6End = await countOrdersInWindow(
          client,
          window.started_at_epoch_ms,
          window.ended_at_epoch_ms,
        );
        console.log(`[analyze-c3b-worker] Persistidos durante k6: ${persistedAtK6End}`);
      } catch (err) {
        if (isPgRetryableError(err)) throw err;
        console.warn(`[analyze-c3b-worker] Snapshot durante k6 falhou: ${err.message}`);
      }

      console.log(
        `[analyze-c3b-worker] Modo drain: ${DRAIN_MODE}` +
          (DRAIN_MODE === 'skip' ? '' : ` (máx ${MAX_DRAIN_SEC}s, poll ${POLL_SEC}s)`),
      );
      const sqsDrain = await waitForQueueDrain();

      const analysisEndedMs = Date.now();
      let rows = [];
      if (events.length > 0) {
        rows = await fetchOrdersByCartIds(client, events.map((e) => e.cartId));
      } else {
        console.warn('[analyze-c3b-worker] Log ENQUEUE vazio — usando janela temporal no banco.');
        rows = await fetchOrdersInWindow(
          client,
          window.started_at_epoch_ms,
          analysisEndedMs,
        );
      }

      await client.end();
      return { persistedAtK6End, sqsDrain, analysisEndedMs, rows };
    } catch (err) {
      lastErr = err;
      if (client) await client.end().catch(() => {});
      if (attempt >= PG_RETRY_MAX || !isPgRetryableError(err)) break;
      await waitPgRetry(attempt, err, 'coleta PostgreSQL');
    }
  }
  throw lastErr;
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

function counterCount(metric) {
  if (!metric) return null;
  const src = metric.values ?? metric;
  return src.count ?? null;
}

function loadK6Summary(resultsDir, canonicalVus = []) {
  const summaryPath = path.join(resultsDir, 'c3b-async.json');
  if (!fs.existsSync(summaryPath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const metrics = raw.metrics || {};
    const http = metrics.http_reqs?.values || metrics.http_reqs || {};
    const asyncReqs = metrics.async_order_requests?.values || metrics.async_order_requests || {};
    const asyncByProfile = {};
    for (const vus of canonicalVus) {
      const key = String(vus);
      asyncByProfile[key] = counterCount(metrics[`async_order_requests_vu${vus}`]);
    }
    return {
      http_requests: http.count ?? null,
      async_order_requests: asyncReqs.count ?? null,
      async_order_requests_by_profile: asyncByProfile,
    };
  } catch {
    return null;
  }
}

/** Perfil de plateau (50, 100, …) a partir do timestamp ENQUEUE vs início do k6. */
function resolveVuProfile(relativeMs, vuProfileWindows, canonicalVus) {
  if (relativeMs == null || Number.isNaN(relativeMs) || relativeMs < 0) return null;

  for (const vus of canonicalVus) {
    const w = vuProfileWindows[String(vus)];
    if (!w) continue;
    if (relativeMs >= w.offset_ms && relativeMs < w.offset_ms + w.duration_ms) {
      return String(vus);
    }
  }

  const last = String(canonicalVus[canonicalVus.length - 1]);
  const lastW = vuProfileWindows[last];
  if (lastW && relativeMs >= lastW.offset_ms) {
    return last;
  }
  return null;
}

function initProfileBuckets(canonicalVus) {
  const buckets = {};
  for (const vus of canonicalVus) {
    buckets[String(vus)] = {
      businessLatencies: [],
      duringK6BusinessLatencies: [],
      postK6Latencies: [],
      enqueued: 0,
      persistedMatched: 0,
      missingAfterDrain: 0,
      persistedDuringK6: 0,
    };
  }
  buckets._unmapped = {
    businessLatencies: [],
    duringK6BusinessLatencies: [],
    postK6Latencies: [],
    enqueued: 0,
    persistedMatched: 0,
    missingAfterDrain: 0,
    persistedDuringK6: 0,
  };
  return buckets;
}

function buildByVuProfile(buckets, canonicalVus, vuProfileDurationS, k6AsyncByProfile) {
  const profiles = {};

  const addProfile = (key, bucket, vusMeta) => {
    if (
      bucket.enqueued === 0
      && bucket.persistedMatched === 0
      && bucket.businessLatencies.length === 0
    ) {
      return;
    }

    const k6Async = k6AsyncByProfile?.[key] ?? null;
    profiles[key] = {
      vus: vusMeta?.vus ?? null,
      duration_s: vuProfileDurationS[key] ?? null,
      enqueue: {
        logged_enqueues: bucket.enqueued,
        k6_async_requests: k6Async,
      },
      persistence: {
        persisted_during_k6: bucket.persistedDuringK6,
        persisted_matched_to_log: bucket.persistedMatched,
        missing_after_drain: bucket.enqueued ? bucket.missingAfterDrain : null,
        not_persisted_estimate:
          k6Async != null && bucket.persistedMatched < k6Async
            ? k6Async - bucket.persistedMatched
            : bucket.enqueued > bucket.persistedMatched
              ? bucket.enqueued - bucket.persistedMatched
              : null,
      },
      during_k6_business_latency_ms: summarizeLatencies(bucket.duringK6BusinessLatencies),
      total_business_latency_ms: summarizeLatencies(bucket.businessLatencies),
      post_k6_drain_latency_ms: summarizeLatencies(bucket.postK6Latencies),
    };
  };

  for (const vus of canonicalVus) {
    const key = String(vus);
    addProfile(key, buckets[key], { vus });
  }

  if (buckets._unmapped.enqueued > 0 || buckets._unmapped.persistedMatched > 0) {
    addProfile('_unmapped', buckets._unmapped, { vus: null });
  }

  return Object.keys(profiles).length ? profiles : undefined;
}

function loadC3bWindow(windowsFile) {
  if (!fs.existsSync(windowsFile)) return null;
  const windows = JSON.parse(fs.readFileSync(windowsFile, 'utf8'));
  const w = windows.tests?.['c3b-async'];
  if (!w) return null;

  const startMs =
    w.started_at_epoch_ms != null && !Number.isNaN(Number(w.started_at_epoch_ms))
      ? Number(w.started_at_epoch_ms)
      : w.started_at
        ? Date.parse(w.started_at)
        : null;
  const endMs =
    w.ended_at_epoch_ms != null && !Number.isNaN(Number(w.ended_at_epoch_ms))
      ? Number(w.ended_at_epoch_ms)
      : w.ended_at
        ? Date.parse(w.ended_at)
        : null;

  if (!startMs || !endMs || Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { ...w, started_at_epoch_ms: null, ended_at_epoch_ms: null };
  }

  return { ...w, started_at_epoch_ms: startMs, ended_at_epoch_ms: endMs };
}

function createPgClient() {
  const config = { connectionString: DB_URL };
  if (/supabase|sslmode=require|neon\.tech|amazonaws\.com/i.test(DB_URL)) {
    config.ssl = { rejectUnauthorized: false };
  }
  return new Client(config);
}

function writeOutput(payload) {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`);
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
  if (DRAIN_MODE === 'skip') {
    return {
      enabled: false,
      mode: 'skip',
      drained: null,
      waited_sec: 0,
      note: 'K6_WORKER_DRAIN_MODE=skip — sem espera SQS (métricas during_k6 + PG no instante da análise)',
    };
  }

  if (!SQS_URL) {
    return {
      enabled: false,
      mode: DRAIN_MODE,
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
        mode: DRAIN_MODE,
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
    mode: DRAIN_MODE,
    drained: false,
    waited_sec: MAX_DRAIN_SEC,
    polls,
    at_start,
    at_end: last,
    note: `Fila não esvaziou em ${MAX_DRAIN_SEC}s (modo ${DRAIN_MODE})`,
  };
}

async function main() {
  if (!RESULTS_DIR) {
    console.error('[analyze-c3b-worker] --dir é obrigatório.');
    process.exit(1);
  }

  const stages = await import('./stages.js');
  const canonicalVus = stages.CANONICAL_VUS;
  const vuProfileWindows = stages.VU_PROFILE_WINDOWS;
  const vuProfileDurationS = Object.fromEntries(
    canonicalVus.map((vus) => [String(vus), parseInt(stages.VU_PROFILE_DURATIONS[vus], 10)]),
  );

  const fail = (message, extra = {}) => {
    writeOutput({
      status: 'failed',
      error: message,
      generated_at: new Date().toISOString(),
      test_name: 'c3b-async',
      results_dir: RESULTS_DIR,
      ...extra,
    });
    console.error(`[analyze-c3b-worker] ${message}`);
    process.exit(1);
  };

  if (!DB_URL) {
    fail('DB_URL não definido — carregue .env na raiz do projeto ou exporte DB_URL.');
  }

  const window = loadC3bWindow(WINDOWS_FILE);
  if (!window?.started_at_epoch_ms || !window?.ended_at_epoch_ms) {
    fail('Janela c3b ausente ou epoch inválido em test-windows.json.', {
      windows_file: WINDOWS_FILE,
      window,
    });
  }

  const k6Summary = loadK6Summary(RESULTS_DIR, canonicalVus);
  const { events, duplicates } = parseEnqueueLog(K6_LOG);
  const profileBuckets = initProfileBuckets(canonicalVus);
  const testStartMs = window.started_at_epoch_ms;
  const testEndMs = window.ended_at_epoch_ms;

  console.log(
    `[analyze-c3b-worker] ENQUEUE no log: ${events.length}` +
      (duplicates ? ` (${duplicates} duplicados ignorados)` : ''),
  );
  console.log(
    `[analyze-c3b-worker] Retry PG: até ${PG_RETRY_MAX} tentativas, espera base ${PG_RETRY_WAIT_SEC}s` +
      (PG_RETRY_BACKOFF ? ' (backoff linear, teto 60s)' : ''),
  );

  let persistedAtK6End = null;
  let sqsDrain;
  let analysisEndedMs;
  let rows = [];
  try {
    ({
      persistedAtK6End,
      sqsDrain,
      analysisEndedMs,
      rows,
    } = await collectPgAnalysisData({ events, window }));
  } catch (err) {
    fail(`Falha ao coletar dados no PostgreSQL após ${PG_RETRY_MAX} tentativas: ${err.message}`, {
      db_url_host: (() => {
        try {
          return new URL(DB_URL.replace(/^postgres(ql)?:/, 'http:')).hostname;
        } catch {
          return null;
        }
      })(),
      pg_retry_max: PG_RETRY_MAX,
      pg_retry_wait_sec: PG_RETRY_WAIT_SEC,
    });
  }

  if (sqsDrain.drained === true) {
    console.log(`[analyze-c3b-worker] Fila esvaziada em ${sqsDrain.waited_sec}s`);
  } else if (sqsDrain.enabled) {
    console.warn(
      `[analyze-c3b-worker] Fila ainda com ${sqsDrain.at_end?.total ?? '?'} mensagens após espera`,
    );
  } else {
    console.warn(`[analyze-c3b-worker] ${sqsDrain.note}`);
  }

  const rowByCart = new Map(rows.map((r) => [r.cart_id, r]));
  const businessLatencies = [];
  const duringK6BusinessLatencies = [];
  const postK6Latencies = [];
  let missingAfterDrain = 0;
  let unmappedEnqueues = 0;

  if (events.length === 0 && rows.length > 0) {
    for (const row of rows) {
      const created = Number(row.created_at_ms);
      if (created > testEndMs) {
        postK6Latencies.push(created - testEndMs);
      }
    }
  }

  for (const event of events) {
    const profileKey =
      resolveVuProfile(event.enqueue_ts_ms - testStartMs, vuProfileWindows, canonicalVus) ||
      '_unmapped';
    const bucket = profileBuckets[profileKey] || profileBuckets._unmapped;
    bucket.enqueued += 1;
    if (profileKey === '_unmapped') unmappedEnqueues += 1;

    const row = rowByCart.get(event.cartId);
    if (!row) {
      missingAfterDrain += 1;
      bucket.missingAfterDrain += 1;
      continue;
    }

    const createdMs = Number(row.created_at_ms);
    const businessMs = createdMs - event.enqueue_ts_ms;
    businessLatencies.push(businessMs);
    bucket.businessLatencies.push(businessMs);
    bucket.persistedMatched += 1;

    if (createdMs <= testEndMs) {
      bucket.persistedDuringK6 += 1;
      duringK6BusinessLatencies.push(businessMs);
      bucket.duringK6BusinessLatencies.push(businessMs);
    }

    if (createdMs > testEndMs) {
      const postK6Ms = createdMs - testEndMs;
      postK6Latencies.push(postK6Ms);
      bucket.postK6Latencies.push(postK6Ms);
    }
  }

  const enqueuedK6 = k6Summary?.async_order_requests ?? k6Summary?.http_requests ?? null;
  const persistedTotal = rows.length;
  const lostAfterEnqueue =
    enqueuedK6 != null && persistedTotal < enqueuedK6 ? enqueuedK6 - persistedTotal : null;

  let status = 'ok';
  const warnings = [];
  if (events.length === 0 && (enqueuedK6 ?? 0) > 0) {
    status = 'partial';
    warnings.push(
      'Nenhum ENQUEUE parseado do k6.log — latência end-to-end por cart_id indisponível (verifique formato do log).',
    );
  }
  if (businessLatencies.length === 0 && duringK6BusinessLatencies.length === 0 && events.length > 0) {
    status = 'partial';
    warnings.push('ENQUEUE no log, mas nenhum cart_id encontrado no PG.');
  }
  if (
    duringK6BusinessLatencies.length === 0
    && (persistedAtK6End ?? 0) > 0
    && events.length > 0
  ) {
    warnings.push(
      `${persistedAtK6End} rows no PG durante k6, mas nenhum cart_id cruzou com o log ENQUEUE — verifique c3b-async.k6.log.`,
    );
  }
  if (DRAIN_MODE === 'skip' && (lostAfterEnqueue ?? 0) > 0) {
    warnings.push(
      'Modo skip_drain: latência e2e reportada em during_k6_business_latency_ms (subset persistido durante o teste). Purge pós-análise é seguro.',
    );
  }
  if (lostAfterEnqueue != null && lostAfterEnqueue > 0) {
    warnings.push(
      `${lostAfterEnqueue} mensagens enfileiradas (k6) não viraram row no PG — fila purgada, worker lento ou falha no consumer.`,
    );
    if (lostAfterEnqueue > (enqueuedK6 ?? 0) * 0.05) status = 'partial';
  }
  if (sqsDrain.drained === true && sqsDrain.waited_sec === 0 && (lostAfterEnqueue ?? 0) > 1000) {
    warnings.push(
      'Fila já vazia no início da análise — provável purge manual antes do drain; métricas de fila podem estar enviesadas.',
    );
  }
  if (unmappedEnqueues > 0) {
    warnings.push(
      `${unmappedEnqueues} ENQUEUE(s) fora das janelas canônicas de perfil — agrupados em by_vu_profile._unmapped.`,
    );
  }

  const byVuProfile = buildByVuProfile(
    profileBuckets,
    canonicalVus,
    vuProfileDurationS,
    k6Summary?.async_order_requests_by_profile,
  );

  const output = {
    status,
    warnings: warnings.length ? warnings : undefined,
    generated_at: new Date().toISOString(),
    test_name: 'c3b-async',
    analysis_mode: DRAIN_MODE,
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
      not_persisted_estimate: lostAfterEnqueue,
      backlog_estimate_at_k6_end:
        enqueuedK6 != null && persistedAtK6End != null
          ? Math.max(0, enqueuedK6 - persistedAtK6End)
          : null,
    },
    during_k6_business_latency_ms: summarizeLatencies(duringK6BusinessLatencies),
    total_business_latency_ms: summarizeLatencies(businessLatencies),
    post_k6_drain_latency_ms: summarizeLatencies(postK6Latencies),
    by_vu_profile: byVuProfile,
    notes: [
      'during_k6_business_latency_ms = created_at ≤ fim do k6 — use com purge pós-teste (não depende de drain).',
      'total_business_latency_ms = todos os cart_id do log encontrados no PG (inclui pós-k6 se houver grace/drain).',
      'post_k6_drain_latency_ms = created_at − fim do k6 (tempo extra na fila/worker após o teste).',
      'by_vu_profile: segmentação por plateau (50→400 VUs) via timestamp ENQUEUE − k6_window.started_at.',
      'Ordem recomendada: k6 → analyze (skip_drain) → purge SQS → setup do próximo teste.',
    ],
  };

  writeOutput(output);
  console.log(`[analyze-c3b-worker] Salvo: ${OUT_FILE}`);

  const primaryLatency =
    output.during_k6_business_latency_ms.samples > 0
      ? output.during_k6_business_latency_ms
      : output.total_business_latency_ms;

  if (primaryLatency.samples > 0) {
    const label =
      output.during_k6_business_latency_ms.samples > 0 ? 'during_k6 e2e' : 'e2e total';
    console.log(
      `[analyze-c3b-worker] Latência ${label}: med=${primaryLatency.med}ms p95=${primaryLatency['p(95)']}ms max=${primaryLatency.max}ms (${primaryLatency.samples} amostras)`,
    );
  }

  if (byVuProfile) {
    console.log('[analyze-c3b-worker] Por perfil de VU (during_k6 e2e med / p95):');
    for (const vus of canonicalVus) {
      const p = byVuProfile[String(vus)];
      const lat =
        p?.during_k6_business_latency_ms?.samples > 0
          ? p.during_k6_business_latency_ms
          : p?.total_business_latency_ms;
      if (!lat?.samples) continue;
      const enq = p.enqueue?.logged_enqueues ?? 0;
      const matched = p.persistence?.persisted_during_k6 ?? p.persistence?.persisted_matched_to_log ?? 0;
      console.log(
        `  vu_${vus}: med=${lat.med}ms p95=${lat['p(95)']}ms` +
          ` (${lat.samples} amostras, ${matched}/${enq} persistidos during_k6)`,
      );
    }
  }
}

main().catch((err) => {
  try {
    writeOutput({
      status: 'failed',
      error: err.message,
      generated_at: new Date().toISOString(),
      test_name: 'c3b-async',
      results_dir: RESULTS_DIR || null,
    });
  } catch {
    /* ignore secondary failure */
  }
  console.error('[analyze-c3b-worker] Erro fatal:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
