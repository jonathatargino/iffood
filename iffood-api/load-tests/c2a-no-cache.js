/**
 * Cenário 2A — Leitura Intensiva SEM Cache
 * Endpoint: GET /store
 *
 * Avalia o impacto de consultas de leitura complexas (JOINs + GROUP BY +
 * getManyAndCount) sem nenhuma camada de cache, com volume elevado de dados.
 * Serve como linha de base para comparação com c2b (com cache Redis).
 *
 * Pré-condição: banco com ≥10.000 registros para estressar o plano de query.
 *
 * Modelo de carga: Ramp-Up agressivo
 *   0 VUs → 25 → 75 → 150 → 200 → 0
 *
 * Variável opcional:
 *   K6_BASE_URL — URL da API (padrão: http://localhost:3006)
 *
 * Métricas customizadas:
 *   store_list_processing_ms  — tempo isolado de processamento (duration - connecting - tls)
 *   store_list_latency        — duração total do request (referência bruta)
 *   store_list_timeouts       — contador de timeouts (proxy de esgotamento de IOPS)
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Configuração ──────────────────────────────────────────────────────────────
const BASE_URL        = __ENV.K6_BASE_URL || 'http://localhost:3006';
const MIN_RECORD_COUNT = 10_000;

// 3. Tag de cenário obrigatória para comparação cruzada com c2b
const SCENARIO = 'no-cache';

// 4. Limite de timeout explícito: acima disso o PostgreSQL provavelmente está
//    com fila de queries saturada por esgotamento de IOPS (t3.micro = 2085 IOPS)
const REQUEST_TIMEOUT_MS = '10s';

// k6 error_codes que indicam timeout de I/O de rede/banco
const TIMEOUT_ERROR_CODES = new Set([1050, 1051, 1052]);

// ── Métricas ──────────────────────────────────────────────────────────────────
// 1. Latência isolada de processamento (sem overhead TCP de reconexão)
const processingTrend = new Trend('store_list_processing_ms', true);
// Duração total mantida como referência bruta para comparação direta no relatório
const latencyTrend    = new Trend('store_list_latency', true);
const errorRate       = new Rate('store_list_errors');
const requestCount    = new Counter('store_list_requests');
const connectLatency  = new Trend('conn_connecting_ms', true);
const tlsLatency      = new Trend('conn_tls_handshaking_ms', true);
// 4. Contador de timeouts: cada ocorrência indica possível saturação de IOPS
const ioTimeouts      = new Counter('store_list_timeouts');

// ── Opções ────────────────────────────────────────────────────────────────────
export const options = {
  // Aumentado para acomodar retries no setup() após cenários de alta contenção
  setupTimeout: '120s',
  stages: [
    { duration: '30s', target: 25  },
    { duration: '30s', target: 75  },
    { duration: '60s', target: 150 },
    { duration: '30s', target: 200 }, // pico: 200 VUs × 10k registros = risco de IOPS
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    // 1. Threshold sobre processing time (sem overhead de rede)
    store_list_processing_ms: ['p(95)<3000'],
    store_list_latency:       ['p(95)<3500'],
    store_list_errors:        ['rate<0.05'],
    // 4. Monitoramento de I/O: mais de 10 timeouts invalida a medição
    //    (indica saturação de IOPS, não apenas latência de query)
    store_list_timeouts:      ['count<10'],
  },
};

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  // Retry com backoff: após cenários de lock contention (c1b), o pool de conexões
  // do PostgreSQL pode estar temporariamente esgotado. Aguarda até 45s pela API.
  const MAX_ATTEMPTS = 3;
  const RETRY_SLEEP_S = 5;
  let res;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    res = http.get(`${BASE_URL}/store?page=1&pageSize=1`);
    if (res.status === 200) break;
    console.warn(
      `[C2A][setup] Tentativa ${attempt}/${MAX_ATTEMPTS}: API retornou status ${res.status}. ` +
      (attempt < MAX_ATTEMPTS ? `Aguardando ${RETRY_SLEEP_S}s para recuperação do pool PG...` : 'Desistindo.'),
    );
    if (attempt < MAX_ATTEMPTS) sleep(RETRY_SLEEP_S);
  }

  if (res.status !== 200) {
    fail(
      `[C2A][setup] API não respondeu após ${MAX_ATTEMPTS} tentativas (último status: ${res.status}). ` +
      `Verifique se o serviço está UP em ${BASE_URL}.`,
    );
  }

  let totalCount = 0;
  try {
    const body = JSON.parse(res.body);
    totalCount = body.total ?? body.count ?? 0;
  } catch {
    console.warn('[C2A][setup] Não foi possível parsear o total do response. Prosseguindo sem validação de volume.');
    return;
  }

  if (totalCount < MIN_RECORD_COUNT) {
    console.warn(
      `[C2A][setup] AVISO: banco possui apenas ${totalCount} registros em /store. ` +
      `Recomendado ≥${MIN_RECORD_COUNT} para estressar o plano de query. ` +
      `Prosseguindo — os resultados podem não refletir condições reais de produção.`,
    );
  } else {
    console.log(`[C2A][setup] Validação de volume OK: ${totalCount} registros encontrados.`);
  }
}

// ── Default ───────────────────────────────────────────────────────────────────
export default function () {
  const page = Math.ceil(Math.random() * 10);

  const res = http.get(`${BASE_URL}/store?page=${page}&pageSize=10`, {
    // 3. Tag de cenário para comparação em gráficos de barra vs c2b
    tags: { endpoint: 'GET /store', scenario: SCENARIO },
    // 4. Timeout explícito: detecta esgotamento de IOPS antes de pendurar o VU
    timeout: REQUEST_TIMEOUT_MS,
  });

  // 1. Isola o tempo de processamento eliminando overhead TCP (connecting) e TLS.
  //    Com HTTP, tls_handshaking é 0, mas a subtração garante correção para HTTPS.
  //    processingMs representa o tempo real de query + serialização no servidor.
  const processingMs = res.timings.duration
    - res.timings.connecting
    - res.timings.tls_handshaking;

  // 4. Detecta timeouts causados por saturação de I/O (PostgreSQL IOPS da t3.micro)
  if (res.error_code && TIMEOUT_ERROR_CODES.has(res.error_code)) {
    ioTimeouts.add(1);
    console.warn(
      `[C2A] Timeout de I/O detectado (error_code=${res.error_code}): ` +
      `page=${page}, duration=${res.timings.duration.toFixed(0)}ms`,
    );
  }

  const passed = check(res, {
    'status 200': (r) => r.status === 200,
    'tem stores': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).stores);
      } catch {
        return false;
      }
    },
  });

  // 1. Adiciona processing time isolado como métrica principal
  processingTrend.add(processingMs);
  latencyTrend.add(res.timings.duration);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!passed);
  requestCount.add(1);

  sleep(Math.random() * 0.5 + 0.1);
}
