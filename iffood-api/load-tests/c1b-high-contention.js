/**
 * Cenário 1B — Concorrência e Lock Pessimista: ALTA CONTENÇÃO
 *
 * 100% dos VUs tentam criar pedidos para o MESMO productOptionId simultaneamente.
 * Isso força colisão máxima no SELECT ... FOR UPDATE do PostgreSQL, serializando
 * transações e revelando o custo real do lock pessimista em carga.
 * Comparar com c1a para isolar o impacto da contenção.
 *
 * Variáveis de ambiente obrigatórias:
 *   K6_AUTH_TOKEN         — JWT do usuário de teste (ex: "Bearer eyJ...")
 *   K6_CONTENTION_TARGET  — JSON { storeId, productId, productOptionId }
 *
 * Opcional:
 *   K6_BASE_URL — URL da API (padrão: http://localhost:3006)
 *
 * Métricas customizadas:
 *   order_high_contention_latency        — duração total (ms)
 *   order_high_contention_processing_ms  — tempo isolado de processamento/DB
 *                                          (= duration - connecting - tls_handshaking)
 *   db_lock_waits                        — contador de requests com processing > 2000ms
 *   health_check_latency                 — latência do /health (diagnóstico de CPU/instância)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { buildCanonicalOptions, computePeakWindow } from './stages.js';
import { createVuProfileMetrics, recordVuProfileMetrics } from './vu-profiles.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Configuração ──────────────────────────────────────────────────────────────
const BASE_URL   = __ENV.K6_BASE_URL          || 'http://localhost:3006';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN;
const TARGET     = __ENV.K6_CONTENTION_TARGET ? JSON.parse(__ENV.K6_CONTENTION_TARGET) : null;

// 2. Tag de identificação dinâmica obrigatória em todas as requests
const SCENARIO = 'high-contention';

// 1. Threshold para isolar tempo de processamento/espera de banco
//    db_lock_waits só é incrementado quando (duration - connecting - tls) > 2000ms
const DB_LOCK_WAIT_THRESHOLD_MS = 2000;

// ── Métricas ──────────────────────────────────────────────────────────────────
const latencyTrend    = new Trend('order_high_contention_latency', true);
// 1. Tempo isolado de processamento (sem overhead TCP/TLS) — diagnóstico de lock DB
const processingTrend = new Trend('order_high_contention_processing_ms', true);
const errorRate       = new Rate('order_high_contention_errors');
const requestCount    = new Counter('order_high_contention_requests');
// Requisições cujo tempo de processamento (DB+app) excede 2s — proxy de lock wait
const dbLockWaits     = new Counter('db_lock_waits');
const connectLatency  = new Trend('conn_connecting_ms', true);
const tlsLatency      = new Trend('conn_tls_handshaking_ms', true);
// 4. Latência do health-check para diagnóstico de esgotamento de CPU
const healthLatency   = new Trend('health_check_latency', true);
const vuMetrics       = createVuProfileMetrics('order_high_contention');

// ── Opções ────────────────────────────────────────────────────────────────────
export const options = buildCanonicalOptions({
  order_high_contention_latency: ['p(95)<10000'],
  order_high_contention_errors:  ['rate<0.2'],
});

// ── Setup (executa uma vez antes dos VUs iniciarem) ───────────────────────────
export function setup() {
  // 6. Timestamps de início e janela esperada do pico (correlação com CloudWatch)
  const startMs                    = Date.now();
  const { peakStart, peakDuration } = computePeakWindow();
  const peakBeginIso               = new Date(startMs + peakStart).toISOString();
  const peakEndIso                 = new Date(startMs + peakStart + peakDuration).toISOString();

  console.log(`[C1B] Teste INICIADO em:         ${new Date(startMs).toISOString()}`);
  console.log(`[C1B] Fase de pico esperada:      ${peakBeginIso}  →  ${peakEndIso}`);
  console.log(`[C1B] Correlacione esse intervalo com as métricas do CloudWatch.`);
  console.log(`[C1B] threshold db_lock_waits:    processingMs > ${DB_LOCK_WAIT_THRESHOLD_MS}ms`);

  return { startMs, peakStart, peakDuration };
}

// ── Teardown ──────────────────────────────────────────────────────────────────
export function teardown() {
  // 6. Timestamp exato de encerramento
  console.log(`[C1B] Teste ENCERRADO em: ${new Date().toISOString()}`);
}

// ── Estado por VU (módulo executado em contexto isolado por VU) ───────────────
let inPeak    = false;
let peakEnded = false;

// ── Default ───────────────────────────────────────────────────────────────────
export default function (data) {
  if (!AUTH_TOKEN || !TARGET) {
    console.error('[C1B] K6_AUTH_TOKEN ou K6_CONTENTION_TARGET não definidos. Abortando.');
    return;
  }

  // 6. Log de transição da fase de pico com timestamp exato (apenas VU 1 para evitar spam)
  if (__VU === 1) {
    const elapsed = Date.now() - data.startMs;
    if (!inPeak && elapsed >= data.peakStart) {
      inPeak = true;
      console.log(`[C1B][PICO] Fase de pico INICIADA:   ${new Date().toISOString()} (elapsed: ${elapsed}ms)`);
    }
    if (inPeak && !peakEnded && elapsed >= data.peakStart + data.peakDuration) {
      peakEnded = true;
      console.log(`[C1B][PICO] Fase de pico ENCERRADA:  ${new Date().toISOString()} (elapsed: ${elapsed}ms)`);
    }
  }

  // 4. Telemetria de infraestrutura: GET /health a cada 10 iterações por VU
  //    Permite distinguir entre esgotamento de CPU da instância e contenção de banco
  if (__ITER % 10 === 0) {
    const healthRes = http.get(`${BASE_URL}/health`, {
      tags: { endpoint: 'health-check', scenario: SCENARIO },
    });
    healthLatency.add(healthRes.timings.duration);
  }

  // Todos os VUs usam o MESMO storeId/productId/productOptionId — força colisão máxima
  const payload = JSON.stringify({
    cartId:  uuidv4(),
    storeId: TARGET.storeId,
    items: [{ productId: TARGET.productId, productOptionId: TARGET.productOptionId, quantity: 1 }],
  });

  const res = http.post(`${BASE_URL}/order-request`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${AUTH_TOKEN}`,
    },
    // 2. Tag de identificação dinâmica obrigatória para comparação cruzada
    tags: { endpoint: 'POST /order-request', scenario: SCENARIO },
  });

  // 1. Isola o tempo de processamento/espera de banco eliminando overhead TCP e TLS.
  //    connecting + tls_handshaking são custos de rede, não de contenção de lock.
  //    processingMs reflete puramente o tempo de app + DB (bloqueio pessimista).
  const processingMs = res.timings.duration
    - res.timings.connecting
    - res.timings.tls_handshaking;

  const passed = check(res, {
    'status 201 ou 200':    (r) => r.status === 201 || r.status === 200,
    // 1. Threshold sobre processing isolado (não duração total)
    'sem lock wait (>2s)':  () => processingMs < DB_LOCK_WAIT_THRESHOLD_MS,
  });

  latencyTrend.add(res.timings.duration);
  recordVuProfileMetrics(vuMetrics, { latencyMs: res.timings.duration, passed });
  processingTrend.add(processingMs);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!passed);
  requestCount.add(1);

  // 1. Incrementa db_lock_waits com base no tempo isolado de processamento
  if (processingMs > DB_LOCK_WAIT_THRESHOLD_MS) {
    dbLockWaits.add(1);
  }

  sleep(Math.random() * 0.3 + 0.05);
}
