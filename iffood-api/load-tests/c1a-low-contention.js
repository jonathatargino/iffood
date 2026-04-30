/**
 * Cenário 1A — Concorrência e Lock Pessimista: BAIXA CONTENÇÃO
 *
 * Cada VU usa um productOptionId diferente — os locks do PostgreSQL
 * (SELECT ... FOR UPDATE) não colidem entre si.
 * Serve como linha de base para comparação com c1b (alta contenção).
 *
 * Variáveis de ambiente obrigatórias:
 *   K6_AUTH_TOKEN    — JWT do usuário de teste (ex: "Bearer eyJ...")
 *   K6_ORDER_TARGETS — JSON array de { storeId, productId, productOptionId }
 *                      (precisa de pelo menos tantos itens quanto VUs para evitar sobreposição)
 *
 * Opcional:
 *   K6_BASE_URL — URL da API (padrão: http://localhost:3006)
 *
 * Métricas customizadas:
 *   order_low_contention_latency — duração total de cada request (ms)
 *   order_low_contention_errors  — taxa de erros HTTP
 *   health_check_latency         — latência do /health (diagnóstico de CPU/instância)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Helpers ───────────────────────────────────────────────────────────────────
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function parseDurationMs(d) {
  if (d.endsWith('s')) return parseInt(d, 10) * 1000;
  if (d.endsWith('m')) return parseInt(d, 10) * 60_000;
  return parseInt(d, 10) * 1000;
}

/**
 * Encontra a janela (offset + duração) do estágio com maior número de VUs.
 * Usado para logar os timestamps esperados da fase de pico.
 */
function computePeakWindow(stages) {
  let offset = 0;
  let maxTarget = 0;
  let peakStart = 0;
  let peakDuration = 0;
  for (const stage of stages) {
    const dur = parseDurationMs(stage.duration);
    if (stage.target > maxTarget) {
      maxTarget    = stage.target;
      peakStart    = offset;
      peakDuration = dur;
    }
    offset += dur;
  }
  return { peakStart, peakDuration };
}

// ── Configuração ──────────────────────────────────────────────────────────────
const BASE_URL     = __ENV.K6_BASE_URL     || 'http://localhost:3006';
const AUTH_TOKEN   = __ENV.K6_AUTH_TOKEN;

const ORDER_TARGETS = __ENV.K6_ORDER_TARGETS ? JSON.parse(__ENV.K6_ORDER_TARGETS) : [];

// 2. Tag de identificação dinâmica obrigatória em todas as requests
const SCENARIO = 'low-contention';

const STAGES = [
  { duration: '30s', target: 10  },
  { duration: '30s', target: 50  },
  { duration: '60s', target: 100 },
  { duration: '30s', target: 150 }, // fase de pico
  { duration: '30s', target: 0   },
];

// ── Métricas ──────────────────────────────────────────────────────────────────
const latencyTrend   = new Trend('order_low_contention_latency', true);
const errorRate      = new Rate('order_low_contention_errors');
const requestCount   = new Counter('order_low_contention_requests');
const connectLatency = new Trend('conn_connecting_ms', true);
const tlsLatency     = new Trend('conn_tls_handshaking_ms', true);
// 4. Latência do health-check para diagnóstico de esgotamento de CPU
const healthLatency  = new Trend('health_check_latency', true);

// ── Opções ────────────────────────────────────────────────────────────────────
export const options = {
  stages: STAGES,
  thresholds: {
    order_low_contention_latency: ['p(95)<5000'],
    order_low_contention_errors:  ['rate<0.1'],
  },
};

// ── Setup (executa uma vez antes dos VUs iniciarem) ───────────────────────────
export function setup() {
  // 3. Validação de limites: alerta se max VUs > ORDER_TARGETS disponíveis
  const maxVUs = Math.max(...STAGES.map((s) => s.target));
  if (maxVUs > ORDER_TARGETS.length) {
    console.warn(
      `[C1A][AVISO CRÍTICO] Máximo de VUs configurado (${maxVUs}) EXCEDE o tamanho ` +
      `do ORDER_TARGETS (${ORDER_TARGETS.length}). VUs acima do limite vão reutilizar ` +
      `os mesmos productOptionIds, causando colisões e INVALIDANDO a premissa de baixa contenção!`,
    );
  } else {
    console.log(
      `[C1A] Validação OK: ${maxVUs} VUs ≤ ${ORDER_TARGETS.length} targets disponíveis — sem risco de colisão.`,
    );
  }

  // 6. Timestamps de início e janela esperada do pico (correlação com CloudWatch)
  const startMs                    = Date.now();
  const { peakStart, peakDuration } = computePeakWindow(STAGES);
  const peakBeginIso               = new Date(startMs + peakStart).toISOString();
  const peakEndIso                 = new Date(startMs + peakStart + peakDuration).toISOString();

  console.log(`[C1A] Teste INICIADO em:         ${new Date(startMs).toISOString()}`);
  console.log(`[C1A] Fase de pico esperada:      ${peakBeginIso}  →  ${peakEndIso}`);
  console.log(`[C1A] Correlacione esse intervalo com as métricas do CloudWatch.`);

  return { startMs, peakStart, peakDuration };
}

// ── Teardown ──────────────────────────────────────────────────────────────────
export function teardown() {
  // 6. Timestamp exato de encerramento
  console.log(`[C1A] Teste ENCERRADO em: ${new Date().toISOString()}`);
}

// ── Estado por VU (módulo executado em contexto isolado por VU) ───────────────
let inPeak    = false;
let peakEnded = false;

// ── Default ───────────────────────────────────────────────────────────────────
export default function (data) {
  if (!AUTH_TOKEN) {
    console.error('[C1A] K6_AUTH_TOKEN não definido. Abortando.');
    return;
  }
  if (ORDER_TARGETS.length === 0) {
    console.error('[C1A] K6_ORDER_TARGETS não definido. Abortando.');
    return;
  }

  // 6. Log de transição da fase de pico com timestamp exato (apenas VU 1 para evitar spam)
  if (__VU === 1) {
    const elapsed = Date.now() - data.startMs;
    if (!inPeak && elapsed >= data.peakStart) {
      inPeak = true;
      console.log(`[C1A][PICO] Fase de pico INICIADA:   ${new Date().toISOString()} (elapsed: ${elapsed}ms)`);
    }
    if (inPeak && !peakEnded && elapsed >= data.peakStart + data.peakDuration) {
      peakEnded = true;
      console.log(`[C1A][PICO] Fase de pico ENCERRADA:  ${new Date().toISOString()} (elapsed: ${elapsed}ms)`);
    }
  }

  // 4. Telemetria de infraestrutura: GET /health a cada 10 iterações por VU
  //    Permite distinguir entre esgotamento de CPU da instância e contenção de banco
  if (__ITER % 10 === 0) {
    const healthRes = http.get(`${BASE_URL}/health`, {
      tags: { endpoint: 'health-check', scenario: SCENARIO },
    });
    healthLatency.add(healthRes.timings.duration);
  }

  // VU 1 → índice 0, VU 2 → índice 1, … garante que cada VU usa um target distinto
  const target  = ORDER_TARGETS[(__VU - 1) % ORDER_TARGETS.length];
  const payload = JSON.stringify({
    cartId:  uuidv4(),
    storeId: target.storeId,
    items: [{ productId: target.productId, productOptionId: target.productOptionId, quantity: 1 }],
  });

  const res = http.post(`${BASE_URL}/order-request`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${AUTH_TOKEN}`,
    },
    // 2. Tag de identificação dinâmica obrigatória para comparação cruzada
    tags: { endpoint: 'POST /order-request', scenario: SCENARIO },
  });

  const passed = check(res, {
    'status 201 ou 200': (r) => r.status === 201 || r.status === 200,
  });

  latencyTrend.add(res.timings.duration);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!passed);
  requestCount.add(1);

  sleep(Math.random() * 0.5 + 0.1);
}
