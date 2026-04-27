/**
 * Cenário 1A — Concorrência e Lock Pessimista: BAIXA CONTENÇÃO
 *
 * Cada VU usa um productOptionId diferente — os locks do PostgreSQL
 * (SELECT ... FOR UPDATE) não colidem entre si.
 * Serve como linha de base para comparação com c1b (alta contenção).
 *
 * Variáveis de ambiente obrigatórias:
 *   K6_AUTH_TOKEN    — JWT do Supabase (ex: "Bearer eyJ...")
 *   K6_ORDER_TARGETS — JSON array de { storeId, productId, productOptionId }
 *                      (precisa de pelo menos tantos itens quanto VUs para evitar sobreposição)
 *
 * Opcional:
 *   K6_BASE_URL — IP privado da EC2 (padrão: http://localhost:3006)
 *
 * Execução:
 *   K6_AUTH_TOKEN="Bearer eyJ..." \
 *   K6_ORDER_TARGETS='[{"storeId":"...","productId":"...","productOptionId":"..."},...]' \
 *   k6 run load-tests/c1a-low-contention.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3006';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN;

/**
 * Lista de pares [storeId, productId, productOptionId] distintos.
 * Cada VU escolhe um índice diferente para evitar contenção.
 * Preencha com dados reais do banco antes de executar.
 */
const ORDER_TARGETS = __ENV.K6_ORDER_TARGETS
  ? JSON.parse(__ENV.K6_ORDER_TARGETS)
  : [];

const latencyTrend = new Trend('order_low_contention_latency', true);
const errorRate = new Rate('order_low_contention_errors');
const requestCount = new Counter('order_low_contention_requests');
const connectLatency = new Trend('conn_connecting_ms', true);
const tlsLatency = new Trend('conn_tls_handshaking_ms', true);

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '60s', target: 100 },
    { duration: '30s', target: 150 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    order_low_contention_latency: ['p(95)<5000'],
    order_low_contention_errors: ['rate<0.1'],
  },
};

export default function () {
  if (!AUTH_TOKEN) {
    console.error('K6_AUTH_TOKEN não definido. Abortando.');
    return;
  }

  if (ORDER_TARGETS.length === 0) {
    console.error('K6_ORDER_TARGETS não definido. Abortando.');
    return;
  }

  const target = ORDER_TARGETS[__VU % ORDER_TARGETS.length];

  const payload = JSON.stringify({
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

  const res = http.post(`${BASE_URL}/order-request`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
    },
    tags: { endpoint: 'POST /order-request', scenario: 'low-contention' },
  });

  const ok = check(res, {
    'status 201 ou 200': (r) => r.status === 201 || r.status === 200,
  });

  latencyTrend.add(res.timings.duration);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!ok);
  requestCount.add(1);

  sleep(Math.random() * 0.5 + 0.1);
}
