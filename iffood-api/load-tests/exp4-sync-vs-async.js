/**
 * Experimento 4 — Sincronismo vs. Assincronismo (BullMQ/Redis)
 *
 * Compara o throughput e a latência de dois modos de criação de pedido:
 *
 *   SYNC  → POST /order-request  (cliente aguarda processamento completo no DB)
 *   ASYNC → POST /orders-async   (retorna 202 Accepted; Worker processa via BullMQ)
 *
 * Métricas comparadas:
 *   - http_req_duration  (latência percebida pelo cliente)
 *   - http_reqs          (throughput total)
 *   - order_sync_latency / order_async_latency (trends isolados por modo)
 *   - async_accepted_rate (taxa de 202 no modo async)
 *
 * Variáveis de ambiente obrigatórias:
 *   K6_AUTH_TOKEN         — JWT do Supabase (ex: "Bearer eyJ...")
 *   K6_ORDER_TARGETS      — JSON array de { storeId, productId, productOptionId }
 *
 * Opcional:
 *   K6_BASE_URL           — IP privado da EC2 (padrão: http://localhost:3006)
 *
 * Execução:
 *   K6_AUTH_TOKEN="Bearer eyJ..." \
 *   K6_ORDER_TARGETS='[{"storeId":"...","productId":"...","productOptionId":"..."}]' \
 *   k6 run exp4-sync-vs-async.js
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3006';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN;
const ORDER_TARGETS = __ENV.K6_ORDER_TARGETS
  ? JSON.parse(__ENV.K6_ORDER_TARGETS)
  : [];

// Métricas isoladas por modo para comparação direta
const syncLatency = new Trend('order_sync_latency', true);
const asyncLatency = new Trend('order_async_latency', true);
const syncErrors = new Rate('order_sync_errors');
const asyncErrors = new Rate('order_async_errors');
const syncRequests = new Counter('order_sync_requests');
const asyncRequests = new Counter('order_async_requests');
const asyncAcceptedRate = new Rate('async_accepted_rate');
const connectLatency = new Trend('conn_connecting_ms', true);
const tlsLatency = new Trend('conn_tls_handshaking_ms', true);

export const options = {
  /**
   * Dois scenarios em paralelo, com o mesmo perfil de carga, para comparação justa.
   * O k6 executa os dois cenários simultaneamente.
   */
  scenarios: {
    sync_orders: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '60s', target: 80 },
        { duration: '30s', target: 120 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'syncScenario',
      tags: { mode: 'sync' },
    },
    async_orders: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '60s', target: 80 },
        { duration: '30s', target: 120 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'asyncScenario',
      tags: { mode: 'async' },
    },
  },
  thresholds: {
    // SYNC: cliente tolera até 5s P95
    order_sync_latency: ['p(95)<5000', 'p(99)<8000'],
    order_sync_errors: ['rate<0.1'],
    // ASYNC: espera-se P95 muito menor — apenas ack de fila
    order_async_latency: ['p(95)<1000', 'p(99)<2000'],
    order_async_errors: ['rate<0.05'],
    // Taxa de 202 Accepted no modo async deve ser alta
    async_accepted_rate: ['rate>0.95'],
  },
};

export function setup() {
  if (!AUTH_TOKEN) {
    fail('[setup] K6_AUTH_TOKEN não definido.');
  }
  if (ORDER_TARGETS.length === 0) {
    fail('[setup] K6_ORDER_TARGETS não definido ou vazio.');
  }
  console.info(`[setup] ${ORDER_TARGETS.length} alvos de pedido carregados. Iniciando comparação SYNC vs ASYNC.`);
}

function buildPayload(target) {
  return JSON.stringify({
    cartId: uuidv4(),
    storeId: target.storeId,
    items: [
      {
        productId: target.productId,
        productOptionId: target.productOptionId,
        quantity: 1,
      },
    ],
  });
}

function commonHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: AUTH_TOKEN,
  };
}

/** Cenário SYNC: POST /order-request — cliente aguarda DB completar */
export function syncScenario() {
  const target = ORDER_TARGETS[__VU % ORDER_TARGETS.length];
  const res = http.post(`${BASE_URL}/order-request`, buildPayload(target), {
    headers: commonHeaders(),
    tags: { endpoint: 'POST /order-request', mode: 'sync' },
  });

  const ok = check(res, {
    '[SYNC] status 200 ou 201': (r) => r.status === 200 || r.status === 201,
  });

  syncLatency.add(res.timings.duration);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  syncErrors.add(!ok);
  syncRequests.add(1);

  sleep(Math.random() * 0.3 + 0.1);
}

/** Cenário ASYNC: POST /orders-async — cliente recebe 202; Worker (BullMQ) processa */
export function asyncScenario() {
  const target = ORDER_TARGETS[__VU % ORDER_TARGETS.length];
  const res = http.post(`${BASE_URL}/orders-async`, buildPayload(target), {
    headers: commonHeaders(),
    tags: { endpoint: 'POST /orders-async', mode: 'async' },
  });

  const accepted = check(res, {
    '[ASYNC] status 202 Accepted': (r) => r.status === 202,
    '[ASYNC] tem jobId no body': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !!body.jobId || !!body.id || !!body.requestId;
      } catch {
        return false;
      }
    },
  });

  asyncLatency.add(res.timings.duration);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  asyncErrors.add(!accepted);
  asyncRequests.add(1);
  asyncAcceptedRate.add(res.status === 202);

  sleep(Math.random() * 0.3 + 0.1);
}
