/**
 * Cenário 4B — Comunicação Assíncrona via SQS (Tratamento Experimental)
 * Endpoint: POST /order-request/async
 *
 * Este teste é o TRATAMENTO EXPERIMENTAL do TCC.
 * Mede o comportamento da rota POST /order-request/async, que enfileira o
 * pedido no Amazon SQS e retorna 202 imediatamente. O processamento real
 * (lock pessimista + persistência) ocorre no worker de forma assíncrona.
 *
 * Será comparado com c4a-sync.js nas dimensões:
 *   - Latência de enfileiramento isolada (avg, p95, p99) — sem ruído de rede AWS
 *   - Throughput (RPS)
 *   - Taxa de erro sob carga crescente
 *   - Resiliência no pico de 200 VUs (manutenção de 202 vs. 5xx do modo síncrono)
 *
 * IMPORTANTE: payload, headers, perfil de carga e think time são intencionalmente
 * idênticos ao c4a-sync.js. A única diferença é o endpoint e o modo de
 * processamento — isso garante comparabilidade científica entre os experimentos.
 *
 * Variáveis de ambiente obrigatórias:
 *   K6_AUTH_TOKEN    — JWT do usuário de teste (ex: "Bearer eyJ...")
 *   K6_ORDER_TARGETS — JSON array de { storeId, productId, productOptionId }
 *
 * Opcionais:
 *   K6_BASE_URL   — URL base da API   (padrão: http://localhost:3006)
 *   K6_CONTENTION — nível de contenção (padrão: low | high)
 *   K6_RUN_ID     — identificador da rodada (ex: "run-2026-04-27-v1")
 *
 * Métricas customizadas:
 *   async_order_processing_ms — tempo isolado de enfileiramento no SQS
 *   async_order_latency       — duração total (referência bruta)
 *   async_accepted_rate       — taxa de 202 Accepted (saúde do enfileiramento)
 *
 * ── METODOLOGIA: total_business_latency ─────────────────────────────────────
 *
 * A latência de negócio TOTAL = t_processado − t_enfileirado, onde:
 *   t_enfileirado = timestamp em que a API retornou 202 (mensurado pelo k6)
 *   t_processado  = updated_at do order_request quando status ≠ 'PENDING' (do banco)
 *
 * Como o k6 não observa o worker, use a seguinte metodologia pós-teste:
 *
 *   1. Este script loga "ENQUEUE cartId=<id> ts=<epoch_ms>" a cada 50 iterações.
 *
 *   2. Exporte esses logs durante o teste:
 *        k6 run c4b-async.js 2>&1 | grep "^ENQUEUE" > enqueue_log.csv
 *
 *   3. Após o teste, execute no banco (cart_id é UUID v4 por requisição):
 *        SELECT cart_id, EXTRACT(EPOCH FROM updated_at)::bigint * 1000 AS processed_at_ms
 *        FROM order_requests
 *        WHERE status IN ('CONCLUDED', 'PENDING')
 *        ORDER BY updated_at DESC;
 *
 *   4. Junte por cart_id e calcule:
 *        total_business_latency_ms = processed_at_ms − ts
 *
 *   5. Importe a coluna total_business_latency_ms como série temporal
 *      no seu painel de resultados para comparar com async_order_processing_ms.
 *
 * Essa métrica composta revela o custo REAL do modelo assíncrono
 * (enfileiramento + propagação + processamento no worker) vs. o modelo
 * síncrono onde o cliente espera pela transação completa.
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

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
//    enfileiramento no SQS (HTTP → API → SQS → 202), sem ruído de rede AWS
const processingTrend = new Trend('async_order_processing_ms', true);
// Duração total mantida como referência bruta para comparação no relatório
const latencyTrend    = new Trend('async_order_latency', true);
const errorRate       = new Rate('async_order_errors');
const requestCount    = new Counter('async_order_requests');
// Taxa de 202 Accepted: saúde do enfileiramento SQS sob carga crescente
const acceptedRate    = new Rate('async_accepted_rate');
// 2. Placeholder para total_business_latency (ver metodologia no cabeçalho).
//    Populado manualmente via pós-processamento: processed_at_ms − enqueue_ts.
const businessLatency = new Trend('total_business_latency', true);

// ── Perfil de carga ───────────────────────────────────────────────────────────
/**
 * Idêntico ao c4a-sync.js — NÃO altere sem replicar lá.
 *
 * 3. O stage final foi elevado de 100 → 200 VUs para demonstrar a resiliência
 *    do modelo assíncrono: enquanto c4a começa a dar 5xx, c4b mantém 202
 *    porque a API apenas enfileira e não aguarda o lock do PostgreSQL.
 */
export const options = {
  stages: [
    { duration: '30s', target: 10  },
    { duration: '60s', target: 50  },
    { duration: '60s', target: 100 },
    // 3. Pico de stress: ponto de divergência entre síncrono (5xx) e assíncrono (202)
    { duration: '60s', target: 200 },
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    // 1. Threshold sobre processing time isolado (custo puro de enfileiramento SQS)
    async_order_processing_ms: ['p(95)<1000', 'p(99)<2000'],
    async_order_latency:       ['p(95)<1200', 'p(99)<2500'],
    async_order_errors:        ['rate<0.05'],
    // Deve permanecer >0.95 mesmo em 200 VUs — prova a resiliência do modelo async
    async_accepted_rate:       ['rate>0.95'],
  },
};

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  if (!AUTH_TOKEN)            fail('[C4B][setup] K6_AUTH_TOKEN não definido.');
  if (ORDER_TARGETS.length === 0) fail('[C4B][setup] K6_ORDER_TARGETS não definido ou vazio.');

  console.log(`[C4B][setup] run_id:        ${RUN_ID}`);
  console.log(`[C4B][setup] contention:    ${CONTENTION}`);
  console.log(`[C4B][setup] order targets: ${ORDER_TARGETS.length}`);
  console.log(`[C4B][setup] pico máximo:   200 VUs — esperado: async mantém 202 enquanto sync dá 5xx.`);
  console.log(`[C4B][setup] total_business_latency: colete logs "ENQUEUE" e junte com updated_at do banco.`);
}

// ── Default ───────────────────────────────────────────────────────────────────
export default function () {
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

  // 2. Registra o timestamp de enfileiramento antes da chamada HTTP.
  //    Amostrado a cada 50 iterações por VU para não saturar os logs.
  //    Formato parseável: "ENQUEUE cartId=<id> ts=<epoch_ms> vu=<n>"
  //    Use: k6 run c4b-async.js 2>&1 | grep "^ENQUEUE" > enqueue_log.csv
  const enqueueTs = Date.now();
  if (__ITER % 50 === 0) {
    console.log(`ENQUEUE cartId=${cartId} ts=${enqueueTs} vu=${__VU}`);
  }

  const res = http.post(`${BASE_URL}/order-request/async`, payload, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH_TOKEN}` },
    tags: {
      endpoint:   'POST /order-request/async',
      mode:       'async',
      contention: CONTENTION,
      // 4. Tag run_id: permite filtrar esta rodada específica em análises cruzadas
      run_id:     RUN_ID,
    },
  });

  // 1. Isola o tempo de processamento: enfileiramento SQS puro, sem overhead TCP
  const processingMs = res.timings.duration
    - res.timings.connecting
    - res.timings.tls_handshaking;

  const accepted = check(res, {
    'status 202 Accepted':    (r) => r.status === 202,
    'body status=processing': (r) => {
      try { return JSON.parse(r.body).status === 'processing'; } catch { return false; }
    },
    'response time < 10s':   (r) => r.timings.duration < 10_000,
  });

  // 1. Processing time como métrica principal (custo puro de enfileiramento SQS)
  processingTrend.add(processingMs);
  latencyTrend.add(res.timings.duration);

  // 2. total_business_latency: impossível calcular em tempo real no k6 pois
  //    depende do processed_at do worker. Veja metodologia no cabeçalho do script.
  //    Após o pós-processamento, popule esta métrica via k6 experimental APIs
  //    ou importe como série separada na ferramenta de visualização.
  void businessLatency; // declarado para visibilidade no relatório de métricas

  errorRate.add(!accepted);
  requestCount.add(1);
  acceptedRate.add(res.status === 202);

  // Think time fixo (determinístico) — idêntico ao c4a para taxa de chegada equivalente
  sleep(0.2);
}
