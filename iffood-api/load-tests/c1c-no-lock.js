/**
 * Cenário 1C — Concorrência Pura Sem Trava Lógica
 *
 * Idêntico ao C1b em perfil de carga: 100% dos VUs colidem no MESMO
 * productOptionId. A diferença é a rota POST /order-request/no-lock, que
 * executa a mesma transação síncrona SEM SELECT ... FOR UPDATE.
 *
 * Baseline experimental para isolar o custo incremental do lock pessimista
 * (comparar order_no_lock_processing_ms vs order_high_contention_processing_ms).
 *
 * Variáveis de ambiente obrigatórias:
 *   K6_AUTH_TOKEN         — JWT do usuário de teste
 *   K6_CONTENTION_TARGET  — JSON { storeId, productId, productOptionId }
 *
 * Opcional:
 *   K6_BASE_URL — URL da API (padrão: http://localhost:3006)
 *
 * Métricas customizadas:
 *   order_no_lock_latency        — duração total (ms)
 *   order_no_lock_processing_ms  — tempo de DB pós-conexão (header x-processing-ms)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { buildCanonicalOptions, computePeakWindow } from './stages.js';
import { createVuProfileMetrics, recordVuProfileMetrics } from './vu-profiles.js';
import { readProcessingMs } from './processing-ms.js';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const BASE_URL   = __ENV.K6_BASE_URL          || 'http://localhost:3006';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN;
const TARGET     = __ENV.K6_CONTENTION_TARGET ? JSON.parse(__ENV.K6_CONTENTION_TARGET) : null;

const SCENARIO = 'no-lock-high-contention';

const SLOW_PROCESSING_THRESHOLD_MS = 2000;

const latencyTrend    = new Trend('order_no_lock_latency', true);
const processingTrend = new Trend('order_no_lock_processing_ms', true);
const errorRate       = new Rate('order_no_lock_errors');
const requestCount    = new Counter('order_no_lock_requests');
const slowProcessing  = new Counter('order_no_lock_slow_processing');
const connectLatency  = new Trend('conn_connecting_ms', true);
const tlsLatency      = new Trend('conn_tls_handshaking_ms', true);
const healthLatency   = new Trend('health_check_latency', true);
const vuMetrics       = createVuProfileMetrics('order_no_lock');

export const options = buildCanonicalOptions({
  order_no_lock_latency: ['p(95)<10000'],
  order_no_lock_errors:  ['rate<0.2'],
});

export function setup() {
  const startMs                    = Date.now();
  const { peakStart, peakDuration } = computePeakWindow();
  const peakBeginIso               = new Date(startMs + peakStart).toISOString();
  const peakEndIso                 = new Date(startMs + peakStart + peakDuration).toISOString();

  console.log(`[C1C] Teste INICIADO em:         ${new Date(startMs).toISOString()}`);
  console.log(`[C1C] Fase de pico esperada:      ${peakBeginIso}  →  ${peakEndIso}`);
  console.log(`[C1C] threshold slow processing: processingMs > ${SLOW_PROCESSING_THRESHOLD_MS}ms`);

  return { startMs, peakStart, peakDuration };
}

export function teardown() {
  console.log(`[C1C] Teste ENCERRADO em: ${new Date().toISOString()}`);
}

let inPeak    = false;
let peakEnded = false;

export default function (data) {
  if (!AUTH_TOKEN || !TARGET) {
    console.error('[C1C] K6_AUTH_TOKEN ou K6_CONTENTION_TARGET não definidos. Abortando.');
    return;
  }

  if (__VU === 1) {
    const elapsed = Date.now() - data.startMs;
    if (!inPeak && elapsed >= data.peakStart) {
      inPeak = true;
      console.log(`[C1C][PICO] Fase de pico INICIADA:   ${new Date().toISOString()} (elapsed: ${elapsed}ms)`);
    }
    if (inPeak && !peakEnded && elapsed >= data.peakStart + data.peakDuration) {
      peakEnded = true;
      console.log(`[C1C][PICO] Fase de pico ENCERRADA:  ${new Date().toISOString()} (elapsed: ${elapsed}ms)`);
    }
  }

  if (__ITER % 10 === 0) {
    const healthRes = http.get(`${BASE_URL}/health`, {
      tags: { endpoint: 'health-check', scenario: SCENARIO },
    });
    healthLatency.add(healthRes.timings.duration);
  }

  const payload = JSON.stringify({
    cartId:  uuidv4(),
    storeId: TARGET.storeId,
    items: [{ productId: TARGET.productId, productOptionId: TARGET.productOptionId, quantity: 1 }],
  });

  const res = http.post(`${BASE_URL}/order-request/no-lock`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${AUTH_TOKEN}`,
    },
    tags: { endpoint: 'POST /order-request/no-lock', scenario: SCENARIO },
  });

  const processingMs = readProcessingMs(res);

  const passed = check(res, {
    'status 201 ou 200':       (r) => r.status === 201 || r.status === 200,
    'processing < 2s':         () => processingMs < SLOW_PROCESSING_THRESHOLD_MS,
  });

  latencyTrend.add(res.timings.duration);
  recordVuProfileMetrics(vuMetrics, { latencyMs: res.timings.duration, passed });
  processingTrend.add(processingMs);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!passed);
  requestCount.add(1);

  if (processingMs > SLOW_PROCESSING_THRESHOLD_MS) {
    slowProcessing.add(1);
  }

  sleep(0.2);
}
