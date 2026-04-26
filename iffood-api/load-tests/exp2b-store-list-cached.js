/**
 * Experimento 2B — Consulta de leitura COM cache Redis
 * Endpoint: GET /store/cached
 *
 * Pré-condição: Redis deve estar disponível e acessível pela API.
 * TTL de cache: 30 segundos (configurado no StoreCacheService).
 *
 * Comparação direta com exp2 (sem cache):
 *   - Mesma estrutura de stages e thresholds para garantir comparação justa
 *   - A diferença de latência revela o ganho real da camada de cache
 *     sobre uma query com 6 JOINs + GROUP BY + getManyAndCount()
 *
 * Leitura esperada dos resultados:
 *   - Primeiras requisições de cada chave → MISS (latência similar ao exp2)
 *   - Requisições subsequentes dentro do TTL → HIT (latência próxima de 0ms de DB)
 *   - store_list_cached_latency P95 deve ser significativamente menor que store_list_latency P95
 *
 * Variável opcional:
 *   K6_BASE_URL — IP privado da EC2 (padrão: http://localhost:3006)
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3006';
const MIN_RECORD_COUNT = 10_000;

const latencyTrend = new Trend('store_list_cached_latency', true);
const errorRate = new Rate('store_list_cached_errors');
const requestCount = new Counter('store_list_cached_requests');
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
    // Com cache, espera-se P95 muito menor que o exp2 (sem cache)
    store_list_cached_latency: ['p(95)<500'],
    store_list_cached_errors: ['rate<0.01'],
  },
};

export function setup() {
  const res = http.get(`${BASE_URL}/store/cached?page=1&pageSize=1`);

  if (res.status !== 200) {
    fail(
      `[setup] GET /store/cached retornou status ${res.status}. ` +
      `Verifique se o endpoint existe e se o Redis está acessível em ${BASE_URL}.`
    );
  }

  let totalCount = 0;
  try {
    const body = JSON.parse(res.body);
    totalCount = body.count ?? 0;
  } catch {
    console.warn('[setup] Não foi possível parsear o total do response. Prosseguindo.');
    return;
  }

  if (totalCount < MIN_RECORD_COUNT) {
    console.warn(
      `[setup] AVISO: apenas ${totalCount} registros encontrados em /store/cached. ` +
      `Recomendado ≥${MIN_RECORD_COUNT} para resultado representativo.`
    );
  } else {
    console.info(`[setup] Validação OK: ${totalCount} registros. Cache Redis ativo (TTL 30s).`);
  }
}

export default function () {
  const page = Math.ceil(Math.random() * 10);
  const res = http.get(`${BASE_URL}/store/cached?page=${page}&pageSize=10`, {
    tags: { endpoint: 'GET /store/cached', cache: 'redis' },
  });

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'tem stores': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.stores);
      } catch {
        return false;
      }
    },
  });

  latencyTrend.add(res.timings.duration);
  connectLatency.add(res.timings.connecting);
  tlsLatency.add(res.timings.tls_handshaking);
  errorRate.add(!ok);
  requestCount.add(1);

  sleep(Math.random() * 0.5 + 0.1);
}
