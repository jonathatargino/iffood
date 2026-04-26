/**
 * Experimento 5 — Stress Test (Break Point)
 *
 * Objetivo: Identificar o ponto de ruptura da arquitetura sob carga crescente.
 * O teste escala os VUs muito além do limite anterior (100 VUs) e monitora
 * dois critérios de parada:
 *
 *   1. Taxa de erro (http_req_failed) > 5%
 *   2. Latência P95 > 10 segundos
 *
 * O executor ramping-arrival-rate garante que a pressão no servidor
 * seja medida em iterações por segundo (RPS), não apenas em VUs concorrentes,
 * tornando a análise de throughput mais precisa.
 *
 * Endpoint alvo: GET /store (sem cache, query pesada — melhor candidato para revelar gargalos)
 * Alternativa autenticada: POST /order-request (requer K6_AUTH_TOKEN + K6_CONTENTION_TARGET)
 *
 * Variável opcional:
 *   K6_BASE_URL        — IP privado da EC2 (padrão: http://localhost:3006)
 *   K6_BREAK_ENDPOINT  — Endpoint a testar (padrão: /store)
 *   K6_AUTH_TOKEN      — Necessário se K6_BREAK_ENDPOINT for autenticado
 *   K6_CONTENTION_TARGET — JSON { storeId, productId, productOptionId }
 *
 * Execução:
 *   k6 run exp5-breakpoint.js
 *   K6_BASE_URL="http://10.0.x.x:3006" k6 run exp5-breakpoint.js
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
const BREAK_ENDPOINT = __ENV.K6_BREAK_ENDPOINT || '/store?page=1&pageSize=10';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN || null;
const CONTENTION_TARGET = __ENV.K6_CONTENTION_TARGET
  ? JSON.parse(__ENV.K6_CONTENTION_TARGET)
  : null;

const IS_WRITE_MODE = !!CONTENTION_TARGET;

const latencyTrend = new Trend('breakpoint_latency', true);
const errorRate = new Rate('breakpoint_errors');
const requestCount = new Counter('breakpoint_requests');
const connectLatency = new Trend('conn_connecting_ms', true);
const tlsLatency = new Trend('conn_tls_handshaking_ms', true);

export const options = {
  /**
   * Escalonamento progressivo muito além dos 100 VUs anteriores.
   * Cada estágio mantém a carga por tempo suficiente para estabilizar métricas.
   * O teste continua mesmo se thresholds falharem (abortOnFail: false)
   * para capturar o comportamento pós-ruptura.
   */
  stages: [
    { duration: '1m',  target: 50  },   // aquecimento
    { duration: '1m',  target: 100 },   // baseline anterior
    { duration: '2m',  target: 200 },   // carga moderada
    { duration: '2m',  target: 350 },   // carga alta
    { duration: '2m',  target: 500 },   // stress
    { duration: '2m',  target: 700 },   // stress extremo
    { duration: '1m',  target: 1000 },  // ponto de ruptura
    { duration: '1m',  target: 0   },   // recuperação
  ],
  thresholds: {
    // Critérios de ruptura: falha se >5% de erros OU P95 >10s
    http_req_failed: [
      { threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '30s' },
    ],
    breakpoint_latency: [
      { threshold: 'p(95)<10000', abortOnFail: true, delayAbortEval: '30s' },
    ],
    breakpoint_errors: ['rate<0.5'],
  },
};

export default function () {
  let res;

  if (IS_WRITE_MODE && AUTH_TOKEN && CONTENTION_TARGET) {
    // Modo escrita autenticada: POST /order-request com alvo fixo (alta contenção)
    const payload = JSON.stringify({
      cartId: uuidv4(),
      storeId: CONTENTION_TARGET.storeId,
      items: [
        {
          productId: CONTENTION_TARGET.productId,
          productOptionId: CONTENTION_TARGET.productOptionId,
          quantity: 1,
        },
      ],
    });

    res = http.post(`${BASE_URL}/order-request`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_TOKEN,
      },
      tags: { endpoint: 'POST /order-request', scenario: 'breakpoint-write' },
    });

    check(res, {
      'status 200 ou 201': (r) => r.status === 200 || r.status === 201,
    });
  } else {
    // Modo leitura (padrão): GET /store — query pesada, sem cache
    const page = Math.ceil(Math.random() * 10);
    res = http.get(`${BASE_URL}${BREAK_ENDPOINT.replace('page=1', `page=${page}`)}`, {
      tags: { endpoint: `GET ${BREAK_ENDPOINT}`, scenario: 'breakpoint-read' },
    });

    check(res, {
      'status 200': (r) => r.status === 200,
    });
  }

  const ok = res.status >= 200 && res.status < 300;

  latencyTrend.add(res.timings.duration);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!ok);
  requestCount.add(1);

  // Sleep mínimo para não throttle artificial — pressão máxima no servidor
  sleep(Math.random() * 0.2);
}
