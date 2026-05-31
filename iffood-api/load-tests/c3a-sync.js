/**
 * Cenário 3A — Comunicação Síncrona (Controle Experimental)
 * Endpoint: POST /order-request
 *
 * Este teste é o CONTROLE EXPERIMENTAL do TCC.
 * Mede o comportamento da rota POST /order-request, que processa o pedido
 * de forma bloqueante: valida estoque com lock pessimista, persiste no banco
 * e só então retorna a resposta ao cliente.
 *
 * Será comparado com c3b-async.js (POST /order-request/async via SQS) nas
 * seguintes dimensões:
 *   - Latência de processamento isolada (avg, p95, p99) — sem ruído de rede AWS
 *   - Throughput (RPS)
 *   - Taxa de erro sob carga crescente
 *   - Ponto de "estouro" (5xx) vs. manutenção de 202 no modo assíncrono
 *
 * Variáveis de ambiente obrigatórias:
 *   K6_AUTH_TOKEN    — JWT do usuário de teste (ex: "Bearer eyJ...")
 *   K6_ORDER_TARGETS — JSON array de { storeId, productId, productOptionId }
 *
 * Opcionais:
 *   K6_BASE_URL  — URL base da API   (padrão: http://localhost:3006)
 *   K6_CONTENTION — nível de contenção (padrão: low | high)
 *   K6_RUN_ID    — identificador da rodada (ex: "run-2026-04-27-v1")
 *                  Separa rodadas distintas em ferramentas de análise de resultados.
 *
 * Métricas customizadas:
 *   sync_order_processing_ms — tempo isolado de lock + DB + serialização
 *   sync_order_latency       — duração total (referência bruta)
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { buildCanonicalOptions, formatStagesSummary, maxStageVUs } from './stages.js';
import { createVuProfileMetrics, recordVuProfileMetrics } from './vu-profiles.js';
import { readProcessingMs } from './processing-ms.js';

/** cartId deve ser UUID (@IsUUID no CreateOrderRequestDto). */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Configuração ──────────────────────────────────────────────────────────────
const BASE_URL      = __ENV.K6_BASE_URL     || 'http://localhost:3006';
const AUTH_TOKEN    = __ENV.K6_AUTH_TOKEN;
const ORDER_TARGETS = __ENV.K6_ORDER_TARGETS ? JSON.parse(__ENV.K6_ORDER_TARGETS) : [];
const CONTENTION    = __ENV.K6_CONTENTION === 'high' ? 'high' : 'low';
// 4. Identificador de rodada: separa execuções em gráficos e bancos de resultados
const RUN_ID        = __ENV.K6_RUN_ID || `run-${Date.now()}`;

// ── Métricas ──────────────────────────────────────────────────────────────────
// 1. Latência isolada: remove overhead TCP/TLS para medir custo puro de
//    lock pessimista + persistência no PostgreSQL + serialização NestJS
const processingTrend = new Trend('sync_order_processing_ms', true);
// Duração total mantida como referência bruta para comparação no relatório
const latencyTrend    = new Trend('sync_order_latency', true);
const errorRate       = new Rate('sync_order_errors');
const requestCount    = new Counter('sync_order_requests');
const vuMetrics       = createVuProfileMetrics('sync_order');

// ── Perfil de carga ───────────────────────────────────────────────────────────
export const options = buildCanonicalOptions({
  sync_order_processing_ms: ['p(95)<5000', 'p(99)<8000'],
  sync_order_latency:       ['p(95)<5500', 'p(99)<9000'],
  sync_order_errors:        ['rate<0.1'],
});

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  if (!AUTH_TOKEN)            fail('[C3A][setup] K6_AUTH_TOKEN não definido.');
  if (ORDER_TARGETS.length === 0) fail('[C3A][setup] K6_ORDER_TARGETS não definido ou vazio.');

  console.log(`[C3A][setup] run_id:        ${RUN_ID}`);
  console.log(`[C3A][setup] contention:    ${CONTENTION}`);
  console.log(`[C3A][setup] order targets: ${ORDER_TARGETS.length}`);
  console.log(`[C3A][setup] pico máximo:   ${maxStageVUs()} VUs — perfil ${formatStagesSummary()}.`);
}

// ── Default ───────────────────────────────────────────────────────────────────
export default function () {
  // low  → cada VU usa um productOption distinto → locks não colidem
  // high → todos os VUs usam o mesmo productOption → máximo conflito de lock
  const target =
    CONTENTION === 'high'
      ? ORDER_TARGETS[0]
      : ORDER_TARGETS[(__VU - 1) % ORDER_TARGETS.length];

  const cartId = uuidv4();

  const payload = JSON.stringify({
    cartId,
    storeId: target.storeId,
    items: [{ productId: target.productId, productOptionId: target.productOptionId, quantity: 1 }],
  });

  const res = http.post(`${BASE_URL}/order-request`, payload, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH_TOKEN}` },
    tags: {
      endpoint:   'POST /order-request',
      mode:       'sync',
      contention: CONTENTION,
      // 4. Tag run_id: permite filtrar esta rodada específica em análises cruzadas
      run_id:     RUN_ID,
    },
  });

  // 1. X-Processing-Ms mede lock + query + serialização após aquisição do pool.
  const processingMs = readProcessingMs(res);

  const passed = check(res, {
    'status 2xx':          (r) => r.status >= 200 && r.status < 300,
    'response time < 10s': (r) => r.timings.duration < 10_000,
  });

  // 1. Processing time como métrica principal (custo puro de DB lock + persistência)
  processingTrend.add(processingMs);
  latencyTrend.add(res.timings.duration);
  recordVuProfileMetrics(vuMetrics, { latencyMs: res.timings.duration, passed });
  errorRate.add(!passed);
  requestCount.add(1);

  // Think time fixo (determinístico) — idêntico ao c3b para taxa de chegada equivalente
  sleep(0.2);
}
