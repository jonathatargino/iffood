/**
 * Cenário 3A — Acoplamento de Dados: Query com JOINs entre módulos (versão atual)
 * Endpoint: GET /product/:id
 *
 * Mede o custo de acoplamento do Monólito Modular ao executar uma query que
 * atravessa múltiplos domínios via JOINs:
 *
 *   product
 *     → productOptions       (módulo: catálogo)
 *     → store                (módulo: loja)
 *     → storeAvailabilities  (módulo: loja / disponibilidade)
 *     → orderRequests        (módulo: pedidos)        ← cruza fronteira de módulo
 *     → reviewRequests       (módulo: avaliações)     ← cruza fronteira de módulo
 *     → reviews              (módulo: avaliações)     ← cruza fronteira de módulo
 *
 * 6 JOINs cruzando pelo menos 3 domínios de negócio distintos.
 * Serve como linha de base para comparação com c3b (query desacoplada).
 *
 * Pré-condição: banco com ≥50.000 order_requests vinculados aos produtos de teste
 *               (gerados por load-tests/setup.js) para revelar o "efeito bola de neve"
 *               no pool de conexões após ~90s de saturação.
 *
 * Variáveis:
 *   K6_BASE_URL    — URL da API (padrão: http://localhost:3006)
 *   K6_PRODUCT_IDS — JSON array de UUIDs de produtos válidos no banco
 *
 * Métricas customizadas:
 *   product_current_processing_ms — tempo isolado (duration - connecting - tls)
 *   product_current_latency       — duração total (referência bruta)
 *   product_current_body_bytes    — tamanho do payload JSON (custo de serialização)
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Configuração ──────────────────────────────────────────────────────────────
const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3006';

// 2. Tag de granularidade para gráfico de dispersão JOINs × Latência P95
const COMPLEXITY = 'high-coupling';

const PRODUCT_IDS = __ENV.K6_PRODUCT_IDS
  ? JSON.parse(__ENV.K6_PRODUCT_IDS)
  : [];

// ── Métricas ──────────────────────────────────────────────────────────────────
// 1. Latência isolada: remove overhead TCP/TLS para medir custo do plano de query
//    e do processamento TypeORM sem ruído de rede
const processingTrend = new Trend('product_current_processing_ms', true);
// Duração total mantida como referência bruta para comparação no relatório final
const latencyTrend    = new Trend('product_current_latency', true);
// 4. Tamanho do body: mede custo de serialização JSON (reviews + orders = payload grande)
const bodyBytes       = new Trend('product_current_body_bytes', true);
const errorRate       = new Rate('product_current_errors');
const requestCount    = new Counter('product_current_requests');
const connectLatency  = new Trend('conn_connecting_ms', true);
const tlsLatency      = new Trend('conn_tls_handshaking_ms', true);

// ── Opções ────────────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 25  },
    { duration: '30s', target: 75  },
    // 3. Ramp-up do pico estendido para 90s: queries com 6 JOINs causam um
    //    "efeito bola de neve" no pool de conexões do PostgreSQL que só se
    //    manifesta após período prolongado de saturação (≈90s de estabilização)
    { duration: '90s', target: 150 },
    { duration: '30s', target: 200 }, // pico
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    // 1. Threshold sobre processing time isolado (custo real de query + TypeORM)
    product_current_processing_ms: ['p(95)<5000'],
    product_current_latency:       ['p(95)<5500'],
    product_current_errors:        ['rate<0.05'],
  },
};

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  if (PRODUCT_IDS.length === 0) {
    fail('[C3A][setup] K6_PRODUCT_IDS não definido. Execute node load-tests/setup.js primeiro.');
  }

  let validCount = 0;
  for (const id of PRODUCT_IDS) {
    const res = http.get(`${BASE_URL}/product/${id}`);
    if (res.status === 200) {
      validCount++;
    } else {
      console.warn(`[C3A][setup] Produto ${id} retornou status ${res.status}. Considere remover da lista.`);
    }
  }

  if (validCount === 0) {
    fail('[C3A][setup] Nenhum produto válido. Configure K6_PRODUCT_IDS com IDs reais do banco.');
  }

  console.log(
    `[C3A][setup] ${validCount}/${PRODUCT_IDS.length} produtos validados. ` +
    `Query: product → productOptions → store → storeAvailabilities → orderRequests → reviewRequests → reviews (6 JOINs, 3+ módulos).`,
  );
  console.log(
    `[C3A][setup] Ramp-up de pico: 90s — aguarda manifestação do "efeito bola de neve" no pool de conexões.`,
  );
}

// ── Default ───────────────────────────────────────────────────────────────────
export default function () {
  if (PRODUCT_IDS.length === 0) return;

  const id  = PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];
  const res = http.get(`${BASE_URL}/product/${id}`, {
    // 2. Tag de granularidade: identifica este cenário como "alto acoplamento"
    //    para eixo X em gráfico de dispersão JOINs × Latência P95
    tags: { endpoint: 'GET /product/:id', complexity: COMPLEXITY, scenario: 'c3a' },
  });

  // 1. Isola o tempo de processamento eliminando overhead TCP e TLS.
  //    processingMs ≈ custo do plano de execução PostgreSQL + carregamento de
  //    entidades TypeORM + serialização NestJS (inclui 6 JOINs e múltiplos módulos).
  const processingMs = res.timings.duration
    - res.timings.connecting
    - res.timings.tls_handshaking;

  const passed = check(res, {
    'status 200':      (r) => r.status === 200,
    'body não vazio':  (r) => r.body && r.body.length > 0,
    // 4. Valida que o payload completo chegou: query acoplada retorna reviews + orders,
    //    garantindo que o custo de serialização JSON do NestJS está sendo medido
    'payload completo': (r) => r.body.length > 500,
  });

  // 1. Processing time como métrica principal (custo real de query + TypeORM)
  processingTrend.add(processingMs);
  latencyTrend.add(res.timings.duration);
  // 4. Tamanho do payload: documenta o custo de serialização no TCC
  bodyBytes.add(res.body ? res.body.length : 0);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!passed);
  requestCount.add(1);

  sleep(Math.random() * 0.5 + 0.1);
}
