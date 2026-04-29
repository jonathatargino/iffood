/**
 * Cenário 3B — Acoplamento de Dados: Query respeitando fronteiras de módulo (otimizada)
 * Endpoint: GET /product/:id/lean
 *
 * Versão otimizada que remove os JOINs que cruzam fronteiras de módulo:
 * orderRequests, reviewRequests e reviews foram eliminados da query.
 *
 * JOINs restantes (apenas dentro do módulo de catálogo):
 *   product → productOptions → store → storeAvailabilities (4 JOINs, 1 módulo)
 *
 * Comparar diretamente com c3a para isolar o custo de acoplamento entre módulos.
 * Modelo de carga idêntico ao c3a — stages sincronizados para comparação justa.
 *
 * Setup: apenas /health + K6_PRODUCT_IDS (sem probe em /lean — alinhado ao c3a).
 *
 * Variáveis:
 *   K6_BASE_URL    — URL da API (padrão: http://localhost:3006)
 *   K6_PRODUCT_IDS — JSON array de UUIDs de produtos válidos no banco
 *   K6_C3_VUS_1…4 — iguais ao c3a (comparação justa). Ver cabeçalho de c3a-coupled-query.js
 *
 * Métricas customizadas:
 *   product_lean_processing_ms — tempo isolado (duration - connecting - tls)
 *   product_lean_latency       — duração total (referência bruta)
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Configuração ──────────────────────────────────────────────────────────────
const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3006';

// 2. Tag de granularidade para gráfico de dispersão JOINs × Latência P95
const COMPLEXITY = 'low-coupling';

const PRODUCT_IDS = __ENV.K6_PRODUCT_IDS
  ? JSON.parse(__ENV.K6_PRODUCT_IDS)
  : [];

function vuFromEnv(key, fallback) {
  const raw = __ENV[key];
  if (raw === undefined || raw === '') return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const STAGE_VUS = [
  vuFromEnv('K6_C3_VUS_1', 5),
  vuFromEnv('K6_C3_VUS_2', 12),
  vuFromEnv('K6_C3_VUS_3', 20),
  vuFromEnv('K6_C3_VUS_4', 20),
];

// ── Métricas ──────────────────────────────────────────────────────────────────
// 1. Latência isolada: remove overhead TCP/TLS para medir custo do plano de query
//    e do processamento TypeORM sem ruído de rede
const processingTrend = new Trend('product_lean_processing_ms', true);
// Duração total mantida como referência bruta para comparação no relatório final
const latencyTrend    = new Trend('product_lean_latency', true);
const errorRate       = new Rate('product_lean_errors');
const requestCount    = new Counter('product_lean_requests');
const connectLatency  = new Trend('conn_connecting_ms', true);
const tlsLatency      = new Trend('conn_tls_handshaking_ms', true);

// ── Opções ────────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: STAGE_VUS[0] },
    { duration: '30s', target: STAGE_VUS[1] },
    { duration: '90s', target: STAGE_VUS[2] },
    { duration: '30s', target: STAGE_VUS[3] },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // Deve permanecer bem abaixo do c3a acoplado (~dezenas de segundos); margem para PG sob carga leve
    product_lean_processing_ms: ['p(95)<8000'],
    product_lean_latency:       ['p(95)<8500'],
    product_lean_errors:        ['rate<0.05'],
  },
};

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  if (PRODUCT_IDS.length === 0) {
    fail('[C3B][setup] K6_PRODUCT_IDS não definido. Execute node load-tests/setup.js primeiro.');
  }

  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) {
    fail(
      `[C3B][setup] GET /health → ${health.status}. API em ${BASE_URL} não está pronta.`,
    );
  }

  console.log(
    `[C3B][setup] API OK (/health). Mesmos stages que c3a: ${STAGE_VUS.join(' → ')}.`,
  );
}

// ── Default ───────────────────────────────────────────────────────────────────
export default function () {
  if (PRODUCT_IDS.length === 0) return;

  const id  = PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];
  const res = http.get(`${BASE_URL}/product/${id}/lean`, {
    // 2. Tag de granularidade: identifica este cenário como "baixo acoplamento"
    //    para eixo X em gráfico de dispersão JOINs × Latência P95
    tags: { endpoint: 'GET /product/:id/lean', complexity: COMPLEXITY, scenario: 'c3b' },
  });

  // 1. Isola o tempo de processamento eliminando overhead TCP e TLS.
  //    processingMs ≈ custo do plano de execução PostgreSQL + carregamento de
  //    entidades TypeORM + serialização NestJS (apenas 4 JOINs, 1 módulo).
  //    A diferença c3a.processingMs − c3b.processingMs isola o custo dos JOINs
  //    cruzando fronteiras de módulo, sem ruído de latência de rede AWS.
  const processingMs = res.timings.duration
    - res.timings.connecting
    - res.timings.tls_handshaking;

  const passed = check(res, {
    'status 200':     (r) => r.status === 200,
    'body não vazio': (r) => r.body && r.body.length > 0,
  });

  // 1. Processing time como métrica principal (custo real de query + TypeORM)
  processingTrend.add(processingMs);
  latencyTrend.add(res.timings.duration);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!passed);
  requestCount.add(1);

  sleep(Math.random() * 0.5 + 0.1);
}
