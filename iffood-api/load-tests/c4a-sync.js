/**
 * Experimento — Criação de pedido SÍNCRONA (Baseline)
 *
 * Este teste é o CONTROLE EXPERIMENTAL do TCC.
 * Mede o comportamento da rota POST /order-request, que processa o pedido
 * de forma bloqueante: valida estoque com lock pessimista, persiste no banco
 * e só então retorna a resposta ao cliente.
 *
 * Será comparado com async-test.js (POST /order-request/async via SQS) nas
 * seguintes dimensões:
 *   - Latência percebida pelo cliente (avg, p95, p99)
 *   - Throughput (RPS)
 *   - Taxa de erro sob carga
 *   - Comportamento sob contenção (baixa vs alta)
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
 *   k6 run load-tests/sync-test.js
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
 * Nível de contenção do experimento.
 *
 * low  → cada VU usa um productOption diferente (sem conflito de lock)
 * high → todos os VUs usam o mesmo productOption (máximo conflito de lock)
 *
 * Controla diretamente a pressão sobre o SELECT FOR UPDATE no PostgreSQL,
 * o que é a variável de interesse no experimento de lock pessimista.
 */
const CONTENTION = __ENV.K6_CONTENTION === 'high' ? 'high' : 'low';

// ─── Métricas ────────────────────────────────────────────────────────────────

const latency = new Trend('sync_order_latency', true);
const errorRate = new Rate('sync_order_errors');
const requestCount = new Counter('sync_order_requests');

// ─── Perfil de carga ─────────────────────────────────────────────────────────

/**
 * Mesmo perfil de ramp-up usado em async-test.js para garantir
 * comparabilidade direta entre as duas abordagens.
 *
 * NOTA: Não altere os stages nem os thresholds sem fazer o mesmo em async-test.js.
 */
export const options = {
  stages: [
    { duration: '30s', target: 10  },
    { duration: '60s', target: 50  },
    { duration: '60s', target: 100 },
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    sync_order_latency: ['p(95)<5000', 'p(99)<8000'],
    sync_order_errors: ['rate<0.1'],
  },
};

// ─── Setup ───────────────────────────────────────────────────────────────────

export function setup() {
  if (!AUTH_TOKEN) fail('[setup] K6_AUTH_TOKEN não definido.');
  if (ORDER_TARGETS.length === 0) fail('[setup] K6_ORDER_TARGETS não definido ou vazio.');
  console.info(
    `[setup] ${ORDER_TARGETS.length} alvos carregados. ` +
    `Iniciando teste SÍNCRONO com contenção=${CONTENTION}.`,
  );
}

// ─── Cenário principal ────────────────────────────────────────────────────────

export default function () {
  /**
   * Seleção do target conforme nível de contenção:
   *
   * low  → VUs distintos usam productOptions distintos → locks não colidem
   * high → todos os VUs usam o mesmo productOption    → locks colidem ao máximo
   *
   * O comportamento do lock pessimista (SELECT FOR UPDATE) no PostgreSQL é
   * a variável dependente principal deste experimento.
   */
  const target =
    CONTENTION === 'high'
      ? ORDER_TARGETS[0]
      : ORDER_TARGETS[__VU % ORDER_TARGETS.length];

  /**
   * cartId determinístico por (VU, iteração).
   *
   * Garante:
   *   - unicidade por requisição (sem duplicatas no banco)
   *   - reprodutibilidade entre execuções (mesmo seed → mesmo comportamento)
   *   - rastreabilidade (possível correlacionar log do worker com VU/iter)
   *
   * Substitui uuidv4() aleatório que impedia repetibilidade experimental.
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

  const res = http.post(`${BASE_URL}/order-request`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_TOKEN,
    },
    tags: {
      endpoint: 'POST /order-request',
      mode: 'sync',
      contention: CONTENTION,
    },
  });

  /**
   * Validação dupla: status HTTP e tempo de resposta.
   * O limite de 10s captura timeouts sem deixar a iteração travar indefinidamente.
   */
  const ok = check(res, {
    'status 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 10s': (r) => r.timings.duration < 10000,
  });

  latency.add(res.timings.duration);
  errorRate.add(!ok);
  requestCount.add(1);

  /**
   * Think time fixo (determinístico).
   *
   * Substitui sleep(Math.random() * 0.3 + 0.1) para eliminar variabilidade
   * na taxa de chegada entre execuções — crítico para reprodutibilidade.
   * Valor idêntico ao usado em async-test.js.
   */
  sleep(0.2);
}
