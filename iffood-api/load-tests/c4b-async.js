/**
 * Experimento — Criação de pedido ASSÍNCRONA (SQS)
 *
 * Este teste é o TRATAMENTO EXPERIMENTAL do TCC.
 * Mede o comportamento da rota POST /order-request/async, que enfileira o
 * pedido no Amazon SQS e retorna 202 imediatamente. O processamento real
 * (lock pessimista + persistência) ocorre no worker de forma assíncrona.
 *
 * Será comparado com sync-test.js (POST /order-request) nas dimensões:
 *   - Latência percebida pelo cliente (avg, p95, p99)
 *   - Throughput (RPS)
 *   - Taxa de erro sob carga
 *   - Comportamento sob contenção (baixa vs alta)
 *
 * IMPORTANTE: payload, headers, perfil de carga e thresholds são intencionalmente
 * idênticos aos do sync-test.js. A única diferença é o endpoint e o modo de
 * processamento — isso garante comparabilidade científica entre os experimentos.
 *
 * Variáveis de ambiente obrigatórias:
 *   K6_AUTH_TOKEN    — JWT do Supabase (ex: "Bearer eyJ...")
 *   K6_ORDER_TARGETS — JSON array de { storeId, productId, productOptionId }
 *
 * Opcionais:
 *   K6_BASE_URL    — URL base da API     (padrão: http://localhost:3006)
 *   K6_CONTENTION  — Nível de contenção  (padrão: low | alto: high)
 *
 * Execução:
 *   K6_AUTH_TOKEN="Bearer eyJ..." \
 *   K6_ORDER_TARGETS='[{"storeId":"...","productId":"...","productOptionId":"..."}]' \
 *   K6_CONTENTION=low \
 *   k6 run load-tests/async-test.js
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ─── Configuração ────────────────────────────────────────────────────────────

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3006';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN;
const ORDER_TARGETS = __ENV.K6_ORDER_TARGETS
  ? JSON.parse(__ENV.K6_ORDER_TARGETS)
  : [];

/**
 * Nível de contenção — mesma semântica do sync-test.js.
 * No modo assíncrono, a contenção afeta o worker (não a API),
 * o que é um aspecto relevante para o experimento.
 */
const CONTENTION = __ENV.K6_CONTENTION === 'high' ? 'high' : 'low';

// ─── Métricas ────────────────────────────────────────────────────────────────

const latency = new Trend('async_order_latency', true);
const errorRate = new Rate('async_order_errors');
const requestCount = new Counter('async_order_requests');

/**
 * Taxa de 202 Accepted — métrica específica da abordagem assíncrona.
 * Indica se o enfileiramento está funcionando corretamente.
 */
const acceptedRate = new Rate('async_accepted_rate');

// ─── Perfil de carga ─────────────────────────────────────────────────────────

/**
 * Idêntico ao sync-test.js — não altere sem replicar em sync-test.js.
 */
export const options = {
  stages: [
    { duration: '30s', target: 10  },
    { duration: '60s', target: 50  },
    { duration: '60s', target: 100 },
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    /**
     * Expectativa: latência muito menor que no modo síncrono.
     * A API apenas enfileira — não espera o banco.
     */
    async_order_latency: ['p(95)<1000', 'p(99)<2000'],
    async_order_errors: ['rate<0.05'],
    async_accepted_rate: ['rate>0.95'],
  },
};

// ─── Setup ───────────────────────────────────────────────────────────────────

export function setup() {
  if (!AUTH_TOKEN) fail('[setup] K6_AUTH_TOKEN não definido.');
  if (ORDER_TARGETS.length === 0) fail('[setup] K6_ORDER_TARGETS não definido ou vazio.');
  console.info(
    `[setup] ${ORDER_TARGETS.length} alvos carregados. ` +
    `Iniciando teste ASSÍNCRONO com contenção=${CONTENTION}.`,
  );
}

// ─── Cenário principal ────────────────────────────────────────────────────────

export default function () {
  /**
   * Mesma lógica de seleção de target do sync-test.js.
   * No modo assíncrono, a contenção ocorre no worker (não na API),
   * mas o cenário de carga deve ser equivalente para comparação justa.
   */
  const target =
    CONTENTION === 'high'
      ? ORDER_TARGETS[0]
      : ORDER_TARGETS[__VU % ORDER_TARGETS.length];

  /**
   * cartId determinístico — idêntico ao sync-test.js.
   * Garante unicidade, reprodutibilidade e rastreabilidade.
   */
  const cartId = `cart-${__VU}-${__ITER}`;

  const payload = JSON.stringify({
    cartId,
    storeId: target.storeId,
    items: [
      {
        productId: target.productId,
        productOptionId: target.productOptionId,
        quantity: 1,
      },
    ],
  });

  const res = http.post(`${BASE_URL}/order-request/async`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
    },
    tags: {
      endpoint: 'POST /order-request/async',
      mode: 'async',
      contention: CONTENTION,
    },
  });

  /**
   * Validação: 202 Accepted + body { status: "processing" } + tempo de resposta.
   * O limite de 10s é conservador — espera-se p99 < 2s no modo assíncrono.
   */
  const accepted = check(res, {
    'status 202 Accepted': (r) => r.status === 202,
    'body status=processing': (r) => {
      try {
        return JSON.parse(r.body).status === 'processing';
      } catch {
        return false;
      }
    },
    'response time < 10s': (r) => r.timings.duration < 10000,
  });

  latency.add(res.timings.duration);
  errorRate.add(!accepted);
  requestCount.add(1);
  acceptedRate.add(res.status === 202);

  /**
   * Think time fixo — idêntico ao sync-test.js.
   * Garante taxa de chegada equivalente entre os dois experimentos.
   */
  sleep(0.2);
}
