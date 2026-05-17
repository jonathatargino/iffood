#!/usr/bin/env node
/**
 * merge-results.js
 *
 * Lê os arquivos de summary-export gerados pelo k6 (um por teste) e os combina
 * em um único JSON estruturado por cenário e teste.
 *
 * Chamado automaticamente pelo run-all.sh ao final de cada bateria.
 * Pode ser usado manualmente para re-consolidar resultados antigos:
 *
 *   node load-tests/merge-results.js \
 *     --dir=load-tests/results/20260426T210000 \
 *     --out=load-tests/results/20260426T210000/all-results.json
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Argumentos ────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=')];
  }),
);

const RESULTS_DIR = args.dir;
const OUT_FILE    = args.out || path.join(RESULTS_DIR, 'all-results.json');
const TIMESTAMP   = args.timestamp || new Date().toISOString();
const BASE_URL    = args['base-url'] || 'http://localhost:3006';

if (!RESULTS_DIR) {
  console.error('[merge-results] Argumento --dir é obrigatório.');
  process.exit(1);
}

// ── Metadados dos testes ──────────────────────────────────────────────────────
const TEST_META = {
  'c1a-low-contention':  { scenario: 1, label: 'Lock Pessimista — Baixa Contenção',      file: 'c1a-low-contention.js'  },
  'c1b-high-contention': { scenario: 1, label: 'Lock Pessimista — Alta Contenção',        file: 'c1b-high-contention.js' },
  'c2a-no-cache':        { scenario: 2, label: 'Leitura Intensiva — Sem Cache',           file: 'c2a-no-cache.js'        },
  'c2b-with-cache':      { scenario: 2, label: 'Leitura Intensiva — Com Cache Redis',     file: 'c2b-with-cache.js'      },
  'c3a-coupled-query':   { scenario: 3, label: 'Acoplamento — Query com JOINs cruzados',  file: 'c3a-coupled-query.js'   },
  'c3b-decoupled-query': { scenario: 3, label: 'Acoplamento — Query desacoplada (lean)',  file: 'c3b-decoupled-query.js' },
  'c4a-sync':            { scenario: 4, label: 'Comunicação Síncrona (POST direto)',       file: 'c4a-sync.js'            },
  'c4b-async':           { scenario: 4, label: 'Comunicação Assíncrona (SQS + worker)',   file: 'c4b-async.js'           },
};

const SCENARIO_LABELS = {
  1: 'Concorrência e Lock Pessimista',
  2: 'Leitura Intensiva e Ausência de Cache',
  3: 'Acoplamento de Dados',
  4: 'Comunicação Assíncrona',
};

/**
 * Métrica Trend principal por script k6 (latência só do endpoint em estudo).
 * Importante em c1a/c1b: não usar http_req_duration como “latência do pedido” no
 * relatório — o k6 agrega também GET /health; os Trends order_* cobrem só POST /order-request.
 */
const PRIMARY_LATENCY_METRIC = {
  'c1a-low-contention': 'order_low_contention_latency',
  'c1b-high-contention': 'order_high_contention_latency',
  'c2a-no-cache': 'store_list_latency',
  'c2b-with-cache': 'store_list_cached_latency',
  'c3a-coupled-query': 'product_current_latency',
  'c3b-decoupled-query': 'product_lean_latency',
  'c4a-sync': 'sync_order_latency',
  'c4b-async': 'async_order_latency',
};

// ── Métricas de interesse por teste ──────────────────────────────────────────
// Quais métricas extrair de cada summary-export.
// O k6 inclui todas no arquivo; aqui selecionamos as relevantes para o TCC.
const METRICS_OF_INTEREST = [
  // latências customizadas por cenário
  'order_low_contention_latency',
  'order_high_contention_latency',
  'store_list_latency',
  'store_list_cached_latency',
  'product_current_latency',
  'product_lean_latency',
  'sync_order_latency',
  'async_order_latency',
  // métricas nativas do k6 (sempre presentes)
  'http_req_duration',
  'http_req_failed',
  'http_reqs',
  'http_req_waiting',
  // métricas específicas
  'db_lock_waits',
  'async_order_processing_ms',
  'async_order_requests',
  'async_accepted_rate',
  'async_order_errors',
  'total_business_latency',
];

// ── Leitura dos arquivos ──────────────────────────────────────────────────────
function readSummary(name) {
  const file = path.join(RESULTS_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return null;

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.warn(`[merge-results] Falha ao ler ${file}: ${e.message}`);
    return null;
  }
}

// Extrai e normaliza métricas relevantes de um summary k6
function extractMetrics(summary) {
  if (!summary || !summary.metrics) return null;

  const out = {};
  for (const key of METRICS_OF_INTEREST) {
    const metric = summary.metrics[key];
    if (metric === undefined) continue;
    out[key] = isTrendLike(metric) ? formatTrend(metric) : metric;
  }
  return out;
}

// Chaves estatísticas de métricas Trend (latência) — inclui stdev para análise de jitter/cauda longa
const TREND_VALUE_KEYS = ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'stdev'];

const TREND_STAT_KEYS = [...TREND_VALUE_KEYS];

// k6 summary-export: valores flat no objeto; handleSummary / JSON oficial: metric.values
function hasTrendStats(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return TREND_STAT_KEYS.some((k) => obj[k] !== undefined);
}

function trendSource(metric) {
  if (!metric) return null;
  if (metric.values && hasTrendStats(metric.values)) return metric.values;
  if (hasTrendStats(metric)) return metric;
  return null;
}

function isTrendLike(metric) {
  return trendSource(metric) !== null;
}

// Formata Trend em objeto legível (med, p(90), stdev, …) preservando thresholds
function formatTrend(metric) {
  const src = trendSource(metric);
  if (!src) return null;

  const out = {};
  for (const key of TREND_VALUE_KEYS) {
    if (src[key] !== undefined) out[key] = round(src[key]);
  }
  if (metric.thresholds) out.thresholds = metric.thresholds;
  return out;
}

function round(v) {
  return v !== undefined ? Math.round(v * 100) / 100 : null;
}

// Counter / Rate: summary-export flat ou aninhado em .values
function counterStats(metric) {
  if (!metric) return null;
  const src = metric.values ?? metric;
  if (src.count === undefined) return null;
  return { count: src.count, rate: src.rate };
}

function rateStats(metric) {
  if (!metric) return null;
  const src = metric.values ?? metric;
  const value = src.value ?? src.rate;
  if (value === undefined && src.passes === undefined) return null;
  return {
    value,
    passes: src.passes,
    fails: src.fails,
  };
}

function buildThroughput(name, rawMetrics) {
  const http = counterStats(rawMetrics?.http_reqs);
  const throughput = {
    total_requests: http?.count ?? null,
    rps_avg: round(http?.rate),
    http: {
      total_requests: http?.count ?? null,
      rps_avg: round(http?.rate),
    },
  };

  if (name !== 'c4b-async') return throughput;

  const enqueued = counterStats(rawMetrics?.async_order_requests);
  const accepted = rateStats(rawMetrics?.async_accepted_rate);
  const errors = rateStats(rawMetrics?.async_order_errors);
  const businessRaw = rawMetrics?.total_business_latency;
  const businessSrc = trendSource(businessRaw);
  const businessCount = businessRaw?.values?.count ?? businessRaw?.count ?? null;

  throughput.accepted_202 = {
    total: enqueued?.count ?? null,
    rps_avg: round(enqueued?.rate),
    acceptance_rate: round(accepted?.value),
  };
  throughput.enqueue_errors = {
    rate: round(errors?.value),
    passes: errors?.passes ?? null,
    fails: errors?.fails ?? null,
  };
  throughput.finalized = businessSrc && businessCount
    ? {
        total: businessCount,
        rps_avg: round(businessRaw?.values?.rate ?? businessRaw?.rate),
        latency: formatTrend(businessRaw),
      }
    : {
        total: null,
        rps_avg: null,
        note: 'Pós-processamento: correlacionar logs ENQUEUE com updated_at do worker (total_business_latency)',
      };

  return throughput;
}

// Detecta a métrica de latência principal a partir do summary bruto do k6
function primaryLatencyKey(name, rawMetrics) {
  if (!rawMetrics) return null;

  const preferred = PRIMARY_LATENCY_METRIC[name];
  if (preferred && trendSource(rawMetrics[preferred])) return preferred;

  const candidates = [
    `${name.replace(/-/g, '_')}_latency`,
    'http_req_duration',
  ];
  for (const c of candidates) {
    if (trendSource(rawMetrics[c])) return c;
  }
  return null;
}

// ── Construção do JSON final ──────────────────────────────────────────────────
const scenarios = {};
for (const num of [1, 2, 3, 4]) {
  scenarios[`scenario_${num}`] = {
    id: num,
    label: SCENARIO_LABELS[num],
    tests: {},
  };
}

let totalRan = 0;
let totalSkipped = 0;

for (const [name, meta] of Object.entries(TEST_META)) {
  const raw = readSummary(name);
  const scenarioKey = `scenario_${meta.scenario}`;

  if (!raw) {
    totalSkipped++;
    scenarios[scenarioKey].tests[name] = {
      label:  meta.label,
      file:   meta.file,
      status: 'skipped',
    };
    continue;
  }

  totalRan++;
  const rawMetrics = raw.metrics ?? {};
  const metrics = extractMetrics(raw);
  const latKey = primaryLatencyKey(name, rawMetrics);
  const latMetric = latKey ? rawMetrics[latKey] : null;

  const entry = {
    label:   meta.label,
    file:    meta.file,
    status:  raw.state === 'aborted' ? 'aborted' : (raw.thresholds_failed ? 'threshold_failed' : 'ok'),
    latency_metric: latKey || null,
    latency: formatTrend(latMetric),
    throughput: buildThroughput(name, rawMetrics),
    error_rate: round(rateStats(rawMetrics.http_req_failed)?.value),
    raw_metrics: metrics,
  };

  // Métricas específicas de cada cenário
  if (name === 'c1b-high-contention' && rawMetrics.db_lock_waits) {
    const lock = counterStats(rawMetrics.db_lock_waits);
    entry.db_lock_waits = lock?.count ?? null;
  }
  if (name === 'c4b-async') {
    const accepted = rateStats(rawMetrics.async_accepted_rate);
    entry.async_accepted_rate = round(accepted?.value);
    const processing = formatTrend(rawMetrics.async_order_processing_ms);
    if (processing) entry.enqueue_processing_ms = processing;
  }

  scenarios[scenarioKey].tests[name] = entry;
}

const output = {
  meta: {
    generated_at: new Date().toISOString(),
    run_id:       TIMESTAMP,
    base_url:     BASE_URL,
    tests_ran:    totalRan,
    tests_skipped: totalSkipped,
  },
  scenarios,
};

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
console.log(`[merge-results] Consolidado: ${totalRan} testes → ${OUT_FILE}`);

// ── Preview no terminal ───────────────────────────────────────────────────────
console.log('\n── Preview de latências (p95 · stdev · throughput) ─────────────');
for (const [, scenario] of Object.entries(output.scenarios)) {
  const tests = Object.entries(scenario.tests).filter(([, t]) => t.status !== 'skipped');
  if (tests.length === 0) continue;

  console.log(`\n  [Cenário ${scenario.id}] ${scenario.label}`);
  for (const [name, test] of tests) {
    const p95 = test.latency?.['p(95)'] ?? '—';
    const stdev = test.latency?.stdev ?? '—';
    const rps = test.throughput?.rps_avg ?? '—';
    const err = test.error_rate !== null ? `${(test.error_rate * 100).toFixed(1)}%` : '—';
    const flag = test.status === 'ok' ? '✓' : test.status === 'threshold_failed' ? '⚠' : '✗';
    let line = `    ${flag} ${name.padEnd(25)} p95=${String(p95).padStart(7)}ms  stdev=${String(stdev).padStart(7)}ms  rps=${String(rps).padStart(6)}  err=${err}`;
    if (name === 'c4b-async' && test.throughput?.accepted_202) {
      const acc = test.throughput.accepted_202;
      line += `  202=${acc.total ?? '—'}@${acc.rps_avg ?? '—'}/s`;
    }
    console.log(line);
  }
}
console.log('');
