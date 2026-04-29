/**
 * Cenário 2B — Leitura Intensiva COM Cache Redis
 * Endpoint: GET /store/cached
 *
 * Avalia o ganho da camada de cache Redis sobre a mesma query de c2a
 * (JOINs + GROUP BY + getManyAndCount). O Redis armazena o resultado
 * por 30 segundos (TTL configurado no StoreCacheService).
 *
 * Resultado esperado:
 *   - Cache MISS (primeira requisição por chave) → latência similar ao c2a
 *   - Cache HIT  (requisições subsequentes)      → latência próxima de 0ms de DB
 *   - store_list_cached_latency P95 << store_list_latency P95 (c2a)
 *
 * Pré-condições:
 *   - Redis acessível pela API
 *   - Banco com ≥10.000 registros (mesmo requisito do c2a)
 *
 * Variável opcional:
 *   K6_BASE_URL — URL da API (padrão: http://localhost:3006)
 *
 * Métricas customizadas:
 *   store_list_cached_processing_ms  — tempo isolado (duration - connecting - tls)
 *   cache_hit_processing_ms          — processing time exclusivo de HIT (Redis puro)
 *   cache_miss_processing_ms         — processing time exclusivo de MISS (DB hit)
 *   cache_hit_rate                   — taxa de HITs (1=HIT, 0=MISS)
 *   store_list_cached_latency        — duração total (referência bruta)
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Configuração ──────────────────────────────────────────────────────────────
const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3006';

// 3. Tag de cenário obrigatória para comparação cruzada com c2a
const SCENARIO = 'redis-cache';

// 2. Threshold heurístico para identificar Cache MISS quando o header X-Cache
//    não está disponível. Processing time > 100ms sugere que a query foi ao DB.
const CACHE_MISS_THRESHOLD_MS = 100;

// ── Métricas ──────────────────────────────────────────────────────────────────
// 1. Latência isolada de processamento (sem overhead TCP/TLS)
const processingTrend = new Trend('store_list_cached_processing_ms', true);
// Duração total mantida como referência bruta
const latencyTrend    = new Trend('store_list_cached_latency', true);

// 2. Métricas separadas por resultado de cache — essenciais para análise de
//    "aquecimento" (warm-up) no capítulo de resultados do TCC
const hitLatency      = new Trend('cache_hit_processing_ms', true);
const missLatency     = new Trend('cache_miss_processing_ms', true);
// 2. Taxa de HIT: permite calcular a curva de aquecimento ao longo do tempo
const cacheHitRate    = new Rate('cache_hit_rate');

const errorRate       = new Rate('store_list_cached_errors');
const requestCount    = new Counter('store_list_cached_requests');
const connectLatency  = new Trend('conn_connecting_ms', true);
const tlsLatency      = new Trend('conn_tls_handshaking_ms', true);

// ── Opções ────────────────────────────────────────────────────────────────────
export const options = {
  setupTimeout: '90s',
  stages: [
    { duration: '30s', target: 25  },
    { duration: '30s', target: 75  },
    { duration: '60s', target: 150 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    // 1. Threshold sobre processing time isolado
    store_list_cached_processing_ms: ['p(95)<500'],
    store_list_cached_latency:       ['p(95)<600'],
    store_list_cached_errors:        ['rate<0.01'],
    // 2. Com aquecimento completo esperamos hit rate acima de 80%
    cache_hit_rate:                  ['rate>0.8'],
  },
};

// ── Setup ─────────────────────────────────────────────────────────────────────
export function setup() {
  const MAX_ATTEMPTS = 2;
  const RETRY_SLEEP_S = 3;
  let res;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    res = http.get(`${BASE_URL}/store/cached?page=1&pageSize=1`);
    if (res.status === 200) break;
    console.warn(
      `[C2B][setup] tentativa ${attempt}/${MAX_ATTEMPTS}: status ${res.status}. ` +
        (attempt < MAX_ATTEMPTS ? `aguardando ${RETRY_SLEEP_S}s…` : 'abortando.'),
    );
    if (attempt < MAX_ATTEMPTS) sleep(RETRY_SLEEP_S);
  }

  if (res.status !== 200) {
    fail(
      `[C2B][setup] GET /store/cached falhou após ${MAX_ATTEMPTS} tentativas (último: ${res.status}). ` +
        `${BASE_URL}`,
    );
  }

  console.log(
    `[C2B][setup] GET /store/cached OK — MISS: header X-Cache ou processingMs > ${CACHE_MISS_THRESHOLD_MS}ms`,
  );
}

// ── Default ───────────────────────────────────────────────────────────────────
export default function () {
  const page = Math.ceil(Math.random() * 10);

  const res = http.get(`${BASE_URL}/store/cached?page=${page}&pageSize=10`, {
    // 3. Tag de cenário para comparação em gráficos de barra vs c2a
    tags: { endpoint: 'GET /store/cached', scenario: SCENARIO },
  });

  // 1. Isola o tempo de processamento eliminando overhead TCP e TLS.
  //    Para Redis: processingMs ≈ tempo de serialização + RTT interno à instância.
  //    Para DB (MISS): processingMs ≈ tempo de query + serialização.
  //    Essa separação é fundamental para o argumento do TCC sobre o ganho do Redis.
  const processingMs = res.timings.duration
    - res.timings.connecting
    - res.timings.tls_handshaking;

  // 2. Identifica Cache HIT ou MISS.
  //    Prioridade 1: header X-Cache retornado pela API (ex: Nginx, CDN, ou middleware).
  //    Prioridade 2: heurística baseada em processingMs — queries ao PostgreSQL
  //    tipicamente levam >100ms com 10k registros; Redis responde em <10ms.
  const xCacheHeader = (res.headers['X-Cache'] || res.headers['x-cache'] || '').toLowerCase();
  let isCacheHit;

  if (xCacheHeader) {
    isCacheHit = xCacheHeader.includes('hit');
  } else {
    isCacheHit = processingMs <= CACHE_MISS_THRESHOLD_MS;
    if (!isCacheHit) {
      console.log(
        `[C2B] Provável Cache MISS: page=${page}, processing=${processingMs.toFixed(1)}ms ` +
        `(threshold: ${CACHE_MISS_THRESHOLD_MS}ms) — consulta foi ao banco.`,
      );
    }
  }

  // 2. Separa as latências de HIT e MISS para análise de aquecimento no TCC
  if (isCacheHit) {
    hitLatency.add(processingMs);
  } else {
    missLatency.add(processingMs);
  }
  cacheHitRate.add(isCacheHit ? 1 : 0);

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
