/**
 * Experimento 1B — Lock Pessimista com ALTA CONTENÇÃO
 *
 * 100% dos VUs tentam criar pedidos para o MESMO productOptionId simultaneamente.
 * Isso força colisão no SELECT ... FOR UPDATE do PostgreSQL, serializando
 * transações e revelando o custo real do lock pessimista em carga.
 *
 * Variáveis de ambiente obrigatórias:
 *   K6_AUTH_TOKEN         — JWT do Supabase (ex: "Bearer eyJ...")
 *   K6_CONTENTION_TARGET  — JSON { storeId, productId, productOptionId }
 *
 * Opcional:
 *   K6_BASE_URL           — IP privado da EC2 (padrão: http://localhost:3006)
 *
 * Métrica customizada:
 *   db_lock_waits — contador de requisições que excedem 2 segundos de resposta,
 *   indicando espera por lock no banco de dados.
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
const TARGET = __ENV.K6_CONTENTION_TARGET
  ? JSON.parse(__ENV.K6_CONTENTION_TARGET)
  : null;

const DB_LOCK_WAIT_THRESHOLD_MS = 2000;

const latencyTrend = new Trend('order_high_contention_latency', true);
const errorRate = new Rate('order_high_contention_errors');
const requestCount = new Counter('order_high_contention_requests');
// Requisições que esperaram >2s — indicativo de contenção de lock no PG
const dbLockWaits = new Counter('db_lock_waits');
const connectLatency = new Trend('conn_connecting_ms', true);
const tlsLatency = new Trend('conn_tls_handshaking_ms', true);

export const options = {
  // Ramp agressivo: todos os VUs convergem no mesmo recurso
  stages: [
    { duration: '15s', target: 20 },
    { duration: '30s', target: 80 },
    { duration: '60s', target: 150 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    order_high_contention_latency: ['p(95)<10000'],
    order_high_contention_errors: ['rate<0.5'],
  },
};

export default function () {
  if (!AUTH_TOKEN || !TARGET) {
    console.error('K6_AUTH_TOKEN ou K6_CONTENTION_TARGET não definidos. Abortando.');
    return;
  }

  // Todos os VUs usam o MESMO storeId/productId/productOptionId para forçar lock
  const payload = JSON.stringify({
    cartId: uuidv4(),
    storeId: TARGET.storeId,
    items: [
      {
        productId: TARGET.productId,
        productOptionId: TARGET.productOptionId,
        quantity: 1,
      },
    ],
  });

  const res = http.post(`${BASE_URL}/order-request`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
    },
    tags: { endpoint: 'POST /order-request', scenario: 'high-contention' },
  });

  const ok = check(res, {
    'status 201 ou 200': (r) => r.status === 201 || r.status === 200,
    'sem timeout de lock': (r) => r.timings.duration < DB_LOCK_WAIT_THRESHOLD_MS,
  });

  latencyTrend.add(res.timings.duration);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!ok);
  requestCount.add(1);

  // Registra a requisição como suspeita de lock wait se exceder 2 segundos
  if (res.timings.duration > DB_LOCK_WAIT_THRESHOLD_MS) {
    dbLockWaits.add(1);
  }

  sleep(Math.random() * 0.3 + 0.05);
}
