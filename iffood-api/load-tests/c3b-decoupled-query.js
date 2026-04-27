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
 * Modelo de carga idêntico ao c3a — não altere os stages sem replicar lá.
 *
 * Variáveis:
 *   K6_BASE_URL    — IP privado da EC2 (padrão: http://localhost:3006)
 *   K6_PRODUCT_IDS — JSON array de UUIDs de produtos válidos no banco
 *
 * Execução:
 *   K6_PRODUCT_IDS='["uuid1","uuid2",...]' k6 run load-tests/c3b-decoupled-query.js
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3006';

const PRODUCT_IDS = __ENV.K6_PRODUCT_IDS
  ? JSON.parse(__ENV.K6_PRODUCT_IDS)
  : [
      '0e5431bd-75fb-43a8-a679-20c018a7eb9f',
      '134f63cd-70a3-4f6f-89d9-3eff5d28dcd7',
      '18f4c92f-1ecb-46ec-94ba-8f3f18c41964',
      '24277261-e5d3-47b1-bff0-1ed0c578086c',
      '2936959e-ad34-4bb1-b380-f36754bd7531',
      '3dc6a6f4-23d3-47a8-a42d-d646877f458e',
      '4712a7ea-fe1a-4bbf-be90-07ace2207ba0',
      '478e1578-208d-4338-b358-19c99b429346',
    ];

const latencyTrend = new Trend('product_lean_latency', true);
const errorRate = new Rate('product_lean_errors');
const requestCount = new Counter('product_lean_requests');
const connectLatency = new Trend('conn_connecting_ms', true);
const tlsLatency = new Trend('conn_tls_handshaking_ms', true);

export const options = {
  stages: [
    { duration: '30s', target: 25 },
    { duration: '30s', target: 75 },
    { duration: '60s', target: 150 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    product_lean_latency: ['p(95)<5000'],
    product_lean_errors: ['rate<0.05'],
  },
};

export function setup() {
  let validCount = 0;
  for (const id of PRODUCT_IDS) {
    const res = http.get(`${BASE_URL}/product/${id}/lean`);
    if (res.status === 200) {
      validCount++;
    } else {
      console.warn(`[setup] Produto ${id}/lean retornou status ${res.status}.`);
    }
  }

  if (validCount === 0) {
    fail('[setup] Nenhum produto válido no endpoint /lean. Configure K6_PRODUCT_IDS com IDs reais.');
  }

  console.info(
    `[setup] ${validCount}/${PRODUCT_IDS.length} produtos validados no endpoint /lean. ` +
    `Query otimizada: product → productOptions → store → storeAvailabilities (4 JOINs, 1 módulo).`
  );
}

export default function () {
  const id = PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];
  const res = http.get(`${BASE_URL}/product/${id}/lean`, {
    tags: { endpoint: 'GET /product/:id/lean (optimized)', version: 'B' },
  });

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'body não vazio': (r) => r.body && r.body.length > 0,
  });

  latencyTrend.add(res.timings.duration);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!ok);
  requestCount.add(1);

  sleep(Math.random() * 0.5 + 0.1);
}
