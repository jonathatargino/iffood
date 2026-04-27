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
  'async_accepted_rate',
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
    if (summary.metrics[key] !== undefined) {
      out[key] = summary.metrics[key];
    }
  }
  return out;
}

// Formata uma métrica de latência (Trend) em objeto legível
function formatTrend(metric) {
  if (!metric || metric.type !== 'Trend') return metric;
  return {
    avg_ms:  round(metric.values?.avg),
    min_ms:  round(metric.values?.min),
    med_ms:  round(metric.values?.med),
    max_ms:  round(metric.values?.max),
    p90_ms:  round(metric.values?.['p(90)']),
    p95_ms:  round(metric.values?.['p(95)']),
    p99_ms:  round(metric.values?.['p(99)']),
  };
}

function round(v) {
  return v !== undefined ? Math.round(v * 100) / 100 : null;
}

// Detecta a métrica de latência principal de um teste
function primaryLatencyKey(name, metrics) {
  const candidates = [
    `${name.replace(/-/g, '_')}_latency`,
    'http_req_duration',
  ];
  for (const c of candidates) {
    if (metrics[c]) return c;
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
  const metrics = extractMetrics(raw);
  const latKey  = primaryLatencyKey(name, metrics);

  const entry = {
    label:   meta.label,
    file:    meta.file,
    status:  raw.state === 'aborted' ? 'aborted' : (raw.thresholds_failed ? 'threshold_failed' : 'ok'),
    latency: latKey ? formatTrend(raw.metrics[latKey]) : null,
    throughput: {
      total_requests: raw.metrics?.http_reqs?.values?.count ?? null,
      rps_avg:        round(raw.metrics?.http_reqs?.values?.rate),
    },
    error_rate: round(raw.metrics?.http_req_failed?.values?.rate),
    raw_metrics: metrics,
  };

  // Métricas específicas de cada cenário
  if (name === 'c1b-high-contention' && metrics.db_lock_waits) {
    entry.db_lock_waits = metrics.db_lock_waits?.values?.count ?? null;
  }
  if (name === 'c4b-async' && metrics.async_accepted_rate) {
    entry.async_accepted_rate = round(metrics.async_accepted_rate?.values?.rate);
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
console.log('\n── Preview de latências (p95) ──────────────────────────────────');
for (const [sKey, scenario] of Object.entries(output.scenarios)) {
  const tests = Object.entries(scenario.tests).filter(([, t]) => t.status !== 'skipped');
  if (tests.length === 0) continue;

  console.log(`\n  [Cenário ${scenario.id}] ${scenario.label}`);
  for (const [name, test] of tests) {
    const p95 = test.latency?.p95_ms ?? '—';
    const rps = test.throughput?.rps_avg ?? '—';
    const err = test.error_rate !== null ? `${(test.error_rate * 100).toFixed(1)}%` : '—';
    const flag = test.status === 'ok' ? '✓' : test.status === 'threshold_failed' ? '⚠' : '✗';
    console.log(`    ${flag} ${name.padEnd(25)} p95=${String(p95).padStart(7)}ms  rps=${String(rps).padStart(6)}  err=${err}`);
  }
}
console.log('');
