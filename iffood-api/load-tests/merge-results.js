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

const WINDOWS_FILE = path.join(RESULTS_DIR, 'test-windows.json');

function loadTestWindows() {
  if (!fs.existsSync(WINDOWS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(WINDOWS_FILE, 'utf8'));
  } catch (e) {
    console.warn(`[merge-results] Falha ao ler ${WINDOWS_FILE}: ${e.message}`);
    return null;
  }
}

function loadWorkerAnalysis(resultsDir) {
  const file = path.join(resultsDir, 'c3b-worker-analysis.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.warn(`[merge-results] Falha ao ler ${file}: ${e.message}`);
    return null;
  }
}

function attachExecutionWindow(entry, testName, windows) {
  const w = windows?.tests?.[testName];
  if (!w) return entry;
  entry.execution = {
    started_at: w.started_at,
    ended_at: w.ended_at,
    started_at_epoch_ms: w.started_at_epoch_ms,
    ended_at_epoch_ms: w.ended_at_epoch_ms,
    duration_ms: w.duration_ms,
    exit_code: w.exit_code,
    run_status: w.status,
    cloudwatch: w.cloudwatch,
  };
  return entry;
}

// ── Metadados dos testes ──────────────────────────────────────────────────────
const TEST_META = {
  'c1a-low-contention':  { scenario: 1, label: 'Lock Pessimista — Baixa Contenção',      file: 'c1a-low-contention.js'  },
  'c1b-high-contention': { scenario: 1, label: 'Lock Pessimista — Alta Contenção',        file: 'c1b-high-contention.js' },
  'c1c-no-lock':         { scenario: 1, label: 'Concorrência Pura — Sem Trava Lógica',    file: 'c1c-no-lock.js'         },
  'c2a-no-cache':        { scenario: 2, label: 'Leitura Intensiva — Sem Cache',           file: 'c2a-no-cache.js'        },
  'c2b-with-cache':      { scenario: 2, label: 'Leitura Intensiva — Com Cache Redis',     file: 'c2b-with-cache.js'      },
  'c3a-sync':            { scenario: 3, label: 'Comunicação Síncrona (POST direto)',       file: 'c3a-sync.js'            },
  'c3b-async':           { scenario: 3, label: 'Comunicação Assíncrona (SQS + worker)',   file: 'c3b-async.js'           },
};

const SCENARIO_LABELS = {
  1: 'Concorrência e Lock Pessimista',
  2: 'Leitura Intensiva e Ausência de Cache',
  3: 'Comunicação Síncrona vs Assíncrona',
};

/**
 * Métrica Trend principal por script k6 (latência só do endpoint em estudo).
 * Importante em c1a/c1b: não usar http_req_duration como “latência do pedido” no
 * relatório — o k6 agrega também GET /health; os Trends order_* cobrem só POST /order-request.
 */
const PRIMARY_LATENCY_METRIC = {
  'c1a-low-contention': 'order_low_contention_latency',
  'c1b-high-contention': 'order_high_contention_latency',
  'c1c-no-lock':         'order_no_lock_latency',
  'c2a-no-cache': 'store_list_latency',
  'c2b-with-cache': 'store_list_cached_latency',
  'c3a-sync': 'sync_order_latency',
  'c3b-async': 'async_order_latency',
};

/** Prefixo das métricas segmentadas por VU — ver load-tests/vu-profiles.js */
const VU_PROFILE_PREFIX = {
  'c1a-low-contention': 'order_low_contention',
  'c1b-high-contention': 'order_high_contention',
  'c1c-no-lock':         'order_no_lock',
  'c2a-no-cache': 'store_list',
  'c2b-with-cache': 'store_list_cached',
  'c3a-sync': 'sync_order',
  'c3b-async': 'async_order',
};

/** Trend de processing_ms (header x-processing-ms ou equivalente k6) por teste. */
const PROCESSING_METRIC = {
  'c1a-low-contention': 'order_low_contention_processing_ms',
  'c1b-high-contention': 'order_high_contention_processing_ms',
  'c1c-no-lock': 'order_no_lock_processing_ms',
  'c2a-no-cache': 'store_list_processing_ms',
  'c2b-with-cache': 'store_list_cached_processing_ms',
  'c3a-sync': 'sync_order_processing_ms',
};

/** Preenchidos em main() a partir de load-tests/stages.js */
let VU_PROFILE_LEVELS = [];
let VU_PROFILE_DURATION_S = {};
let VU_PROFILES_MODEL = '';

// ── Métricas de interesse por teste ──────────────────────────────────────────
// Quais métricas extrair de cada summary-export.
// O k6 inclui todas no arquivo; aqui selecionamos as relevantes para o TCC.
const METRICS_OF_INTEREST = [
  // latências customizadas por cenário
  'order_low_contention_latency',
  'order_low_contention_processing_ms',
  'order_high_contention_latency',
  'order_high_contention_processing_ms',
  'order_no_lock_latency',
  'order_no_lock_processing_ms',
  'store_list_latency',
  'store_list_processing_ms',
  'store_list_cached_latency',
  'store_list_cached_processing_ms',
  'cache_hit_processing_ms',
  'cache_miss_processing_ms',
  'cache_hit_rate',
  'sync_order_latency',
  'sync_order_processing_ms',
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

/** Throughput por perfil de VU a partir do Counter dedicado (não http_reqs agregado). */
function buildProfileThroughput(rawMetrics, prefix, vus) {
  const reqKey = `${prefix}_requests_vu${vus}`;
  const requests = counterStats(rawMetrics[reqKey]);
  const durationS = VU_PROFILE_DURATION_S[vus];
  const rpsFromCounter =
    requests?.count != null && durationS
      ? round(requests.count / durationS)
      : round(requests?.rate);

  return {
    total_requests: requests?.count ?? null,
    rps_avg: rpsFromCounter ?? round(requests?.rate),
    duration_s: durationS,
  };
}

/**
 * Extrai latência, RPS e taxa de erro por plateau de VUs (CANONICAL_VUS).
 * Depende das métricas {prefix}_latency_vu* geradas por vu-profiles.js.
 */
function extractByVuProfile(name, rawMetrics) {
  const prefix = VU_PROFILE_PREFIX[name];
  if (!prefix || !rawMetrics) return null;

  const profiles = {};

  for (const vus of VU_PROFILE_LEVELS) {
    const latKey = `${prefix}_latency_vu${vus}`;
    const errKey = `${prefix}_errors_vu${vus}`;
    const latency = formatTrend(rawMetrics[latKey]);
    const throughput = buildProfileThroughput(rawMetrics, prefix, vus);

    if (!latency && throughput.total_requests == null) continue;

    const profile = {
      vus,
      duration_s: VU_PROFILE_DURATION_S[vus],
      latency: latency || null,
      throughput,
      error_rate: round(rateStats(rawMetrics[errKey])?.value),
    };

    if (name === 'c3b-async') {
      profile.acceptance_rate = round(
        rateStats(rawMetrics[`async_accepted_rate_vu${vus}`])?.value,
      );
    }

    profiles[String(vus)] = profile;
  }

  return Object.keys(profiles).length > 0 ? profiles : null;
}

function pickWorkerLatency(workerAnalysis) {
  const during = workerAnalysis?.during_k6_business_latency_ms;
  const total = workerAnalysis?.total_business_latency_ms;
  if (during?.samples > 0) {
    return { latency: during, scope: 'during_k6' };
  }
  if (total?.samples > 0) {
    return { latency: total, scope: 'all_matched' };
  }
  return { latency: null, scope: null };
}

/** Cruza by_vu_profile do worker (e2e PG) com o segmentado do k6 (HTTP). */
function attachWorkerVuProfiles(entry, workerAnalysis) {
  const workerProfiles = workerAnalysis?.by_vu_profile;
  if (
    !workerProfiles
    || (workerAnalysis.status !== 'ok' && workerAnalysis.status !== 'partial')
  ) {
    return null;
  }

  if (!entry.by_vu_profile) entry.by_vu_profile = {};

  const finalizedByProfile = {};

  for (const [key, wp] of Object.entries(workerProfiles)) {
    if (key === '_unmapped') continue;

    if (!entry.by_vu_profile[key]) {
      entry.by_vu_profile[key] = {
        vus: wp.vus,
        duration_s: wp.duration_s,
      };
    }

    entry.by_vu_profile[key].worker = {
      enqueue: wp.enqueue,
      persistence: wp.persistence,
      during_k6_business_latency_ms: wp.during_k6_business_latency_ms,
      total_business_latency_ms: wp.total_business_latency_ms,
      post_k6_drain_latency_ms: wp.post_k6_drain_latency_ms,
    };

    const profileLatency =
      wp.during_k6_business_latency_ms?.samples > 0
        ? wp.during_k6_business_latency_ms
        : wp.total_business_latency_ms;

    if (profileLatency?.samples > 0 || wp.persistence?.persisted_matched_to_log) {
      finalizedByProfile[key] = {
        total: wp.persistence?.persisted_during_k6 ?? wp.persistence?.persisted_matched_to_log ?? null,
        latency: profileLatency,
        latency_scope:
          wp.during_k6_business_latency_ms?.samples > 0 ? 'during_k6' : 'all_matched',
        during_k6_business_latency_ms: wp.during_k6_business_latency_ms,
        total_business_latency_ms: wp.total_business_latency_ms,
        post_k6_drain_latency_ms: wp.post_k6_drain_latency_ms,
        persistence: wp.persistence,
      };
    }
  }

  return Object.keys(finalizedByProfile).length > 0 ? finalizedByProfile : null;
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

  if (name !== 'c3b-async') return throughput;

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
async function main() {
  const stages = await import('./stages.js');
  VU_PROFILE_LEVELS = stages.CANONICAL_VUS;
  VU_PROFILE_DURATION_S = Object.fromEntries(
    stages.CANONICAL_VUS.map((vus) => [vus, parseInt(stages.VU_PROFILE_DURATIONS[vus], 10)]),
  );
  VU_PROFILES_MODEL = stages.formatStagesSummary();

const workerAnalysis = loadWorkerAnalysis(RESULTS_DIR);

const scenarios = {};
for (const num of [1, 2, 3]) {
  scenarios[`scenario_${num}`] = {
    id: num,
    label: SCENARIO_LABELS[num],
    tests: {},
  };
}

let totalRan = 0;
let totalSkipped = 0;
const testWindows = loadTestWindows();

for (const [name, meta] of Object.entries(TEST_META)) {
  const raw = readSummary(name);
  const scenarioKey = `scenario_${meta.scenario}`;

  if (!raw) {
    totalSkipped++;
    const skippedEntry = {
      label:  meta.label,
      file:   meta.file,
      status: testWindows?.tests?.[name]?.status === 'skip' ? 'skipped' : 'skipped',
    };
    attachExecutionWindow(skippedEntry, name, testWindows);
    scenarios[scenarioKey].tests[name] = skippedEntry;
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
    by_vu_profile: extractByVuProfile(name, rawMetrics),
    raw_metrics: metrics,
  };

  // Métricas específicas de cada cenário
  if (name === 'c1a-low-contention' || name === 'c1b-high-contention') {
    if (rawMetrics.db_lock_waits) {
      const lock = counterStats(rawMetrics.db_lock_waits);
      entry.db_lock_waits = lock?.count ?? null;
    }
  }

  const procKey = PROCESSING_METRIC[name];
  if (procKey) {
    const processing = formatTrend(rawMetrics[procKey]);
    if (processing) entry.processing_ms = processing;
  }

  if (name === 'c2b-with-cache') {
    const hitRate = rateStats(rawMetrics.cache_hit_rate);
    if (hitRate) entry.cache_hit_rate = round(hitRate.value);
    const hitProc = formatTrend(rawMetrics.cache_hit_processing_ms);
    const missProc = formatTrend(rawMetrics.cache_miss_processing_ms);
    if (hitProc) entry.cache_hit_processing_ms = hitProc;
    if (missProc) entry.cache_miss_processing_ms = missProc;
  }

  if (name === 'c3b-async') {
    const accepted = rateStats(rawMetrics.async_accepted_rate);
    entry.async_accepted_rate = round(accepted?.value);
    const processing = formatTrend(rawMetrics.async_order_processing_ms);
    if (processing) entry.enqueue_processing_ms = processing;
    if (workerAnalysis) {
      entry.worker_processing = workerAnalysis;
      if (workerAnalysis.status === 'ok' || workerAnalysis.status === 'partial') {
        const finalizedByProfile = attachWorkerVuProfiles(entry, workerAnalysis);
        const { latency: workerLatency, scope: latencyScope } = pickWorkerLatency(workerAnalysis);
        if (
          workerLatency?.samples > 0
          || workerAnalysis.post_k6_drain_latency_ms?.samples > 0
        ) {
          entry.throughput.finalized = {
            total:
              workerAnalysis.persistence?.persisted_during_k6
              ?? workerAnalysis.persistence?.persisted_matched_to_log
              ?? workerAnalysis.persistence?.persisted_total
              ?? null,
            latency: workerLatency,
            latency_scope: latencyScope,
            during_k6_business_latency_ms: workerAnalysis.during_k6_business_latency_ms,
            total_business_latency_ms: workerAnalysis.total_business_latency_ms,
            post_k6_drain_latency_ms: workerAnalysis.post_k6_drain_latency_ms,
            analysis_mode: workerAnalysis.analysis_mode,
            sqs_drain: workerAnalysis.sqs_drain,
            persistence: workerAnalysis.persistence,
            warnings: workerAnalysis.warnings,
            ...(finalizedByProfile ? { by_vu_profile: finalizedByProfile } : {}),
          };
        } else if (finalizedByProfile) {
          entry.throughput.finalized = { by_vu_profile: finalizedByProfile };
        }
      }
    }
  }

  attachExecutionWindow(entry, name, testWindows);
  scenarios[scenarioKey].tests[name] = entry;
}

const cloudwatchTimeline = testWindows
  ? Object.entries(testWindows.tests || {})
      .filter(([, w]) => w.started_at && w.ended_at)
      .map(([testId, w]) => ({
        test_id: testId,
        scenario: w.scenario,
        started_at: w.started_at,
        ended_at: w.ended_at,
        started_at_epoch_ms: w.started_at_epoch_ms,
        ended_at_epoch_ms: w.ended_at_epoch_ms,
        duration_ms: w.duration_ms,
      }))
  : [];

const output = {
  meta: {
    generated_at: new Date().toISOString(),
    run_id:       TIMESTAMP,
    base_url:     BASE_URL,
    tests_ran:    totalRan,
    tests_skipped: totalSkipped,
    timezone: 'UTC',
    batch: testWindows?.batch ?? null,
    cloudwatch: testWindows?.cloudwatch ?? {
      note: 'Execute ./load-tests/run-all.sh para gerar test-windows.json com janelas UTC.',
    },
    cloudwatch_timeline: cloudwatchTimeline,
    vu_profiles: {
      levels: VU_PROFILE_LEVELS,
      duration_s: VU_PROFILE_DURATION_S,
      model: VU_PROFILES_MODEL,
    },
  },
  scenarios,
  test_windows: testWindows,
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
    if (name === 'c3b-async' && test.throughput?.accepted_202) {
      const acc = test.throughput.accepted_202;
      line += `  202=${acc.total ?? '—'}@${acc.rps_avg ?? '—'}/s`;
    }
    const win = test.execution?.cloudwatch;
    if (win?.from) {
      line += `  CW=${win.from}→${win.to}`;
    }
    console.log(line);

    if (test.by_vu_profile) {
      for (const vus of VU_PROFILE_LEVELS) {
        const p = test.by_vu_profile[String(vus)];
        if (!p) continue;
        const pp95 = p.latency?.['p(95)'] ?? '—';
        const prps = p.throughput?.rps_avg ?? '—';
        const perr = p.error_rate != null ? `${(p.error_rate * 100).toFixed(1)}%` : '—';
        let pline = `      @${String(vus).padStart(3)} VUs  p95=${String(pp95).padStart(7)}ms  rps=${String(prps).padStart(6)}  err=${perr}`;
        if (p.acceptance_rate != null) {
          pline += `  accept=${(p.acceptance_rate * 100).toFixed(1)}%`;
        }
        console.log(pline);
        if (p.worker?.during_k6_business_latency_ms?.samples > 0 || p.worker?.total_business_latency_ms?.samples > 0) {
          const we =
            p.worker.during_k6_business_latency_ms?.samples > 0
              ? p.worker.during_k6_business_latency_ms
              : p.worker.total_business_latency_ms;
          const matched = p.worker.persistence?.persisted_during_k6 ?? p.worker.persistence?.persisted_matched_to_log ?? '—';
          const enq = p.worker.enqueue?.logged_enqueues ?? '—';
          console.log(
            `        worker e2e med=${we.med ?? '—'}ms p95=${we['p(95)'] ?? '—'}ms` +
              ` (${we.samples} amostras, ${matched}/${enq} during_k6)`,
          );
        }
      }
    }
  }
}

if (cloudwatchTimeline.length > 0) {
  console.log('\n── CloudWatch (UTC) — use intervalo absoluto no console ────────');
  for (const row of cloudwatchTimeline) {
    const sec = row.duration_ms != null ? `${(row.duration_ms / 1000).toFixed(1)}s` : '?';
    console.log(
      `  ${row.test_id.padEnd(24)} ${row.started_at}  →  ${row.ended_at}  (${sec})`,
    );
  }
}
console.log('');
}

main().catch((err) => {
  console.error('[merge-results] Erro fatal:', err);
  process.exit(1);
});
