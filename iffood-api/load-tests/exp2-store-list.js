/**
 * Experimento 2 — Consulta de leitura sem cache (volume de dados)
 * Endpoint: GET /store
 *
 * Objetivo: Avaliar o impacto de uma query com 6 JOINs, GROUP BY e
 * getManyAndCount() (2 queries por requisição) sem qualquer camada de cache.
 *
 * Pré-condição: O banco deve ter ≥10.000 registros na tabela alvo.
 * A fase setup() verifica isso via endpoint de health/count antes de prosseguir.
 *
 * Modelo de carga: Ramp-Up agressivo
 *   0 VUs → 25 → 75 → 150 → 200 → 0
 *
 * Variável opcional:
 *   K6_BASE_URL — IP privado da EC2 (padrão: http://localhost:3006)
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3006';

// Limiar de volume mínimo de registros no banco antes de iniciar o teste
const MIN_RECORD_COUNT = 10_000;

const latencyTrend = new Trend('store_list_latency', true);
const errorRate = new Rate('store_list_errors');
const requestCount = new Counter('store_list_requests');
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
    store_list_latency: ['p(95)<3000'],
    store_list_errors: ['rate<0.05'],
  },
};

/**
 * setup() roda uma única vez antes dos VUs iniciarem.
 * Verifica se o banco possui volume suficiente de dados para o experimento.
 * Se não houver um endpoint de contagem, logue o aviso e prossiga.
 */
export function setup() {
  const res = http.get(`${BASE_URL}/store?page=1&pageSize=1`);

  if (res.status !== 200) {
    fail(`[setup] API não respondeu corretamente (status ${res.status}). Verifique se o serviço está UP em ${BASE_URL}.`);
  }

  let totalCount = 0;
  try {
    const body = JSON.parse(res.body);
    // Tenta ler o total retornado pelo endpoint paginado (ex: { total: N, stores: [...] })
    totalCount = body.total ?? body.count ?? 0;
  } catch {
    console.warn('[setup] Não foi possível parsear o total do response. Prosseguindo sem validação de volume.');
    return;
  }

  if (totalCount < MIN_RECORD_COUNT) {
    console.warn(
      `[setup] AVISO: banco possui apenas ${totalCount} registros em /store. ` +
      `Recomendado ≥${MIN_RECORD_COUNT} para um teste representativo de volume. ` +
      `Prosseguindo mesmo assim — os resultados podem não refletir condições de produção.`
    );
  } else {
    console.info(`[setup] Validação de volume OK: ${totalCount} registros encontrados.`);
  }
}

export default function () {
  // Distribui entre as primeiras 10 páginas para variar o resultado do DB
  const page = Math.ceil(Math.random() * 10);
  const res = http.get(`${BASE_URL}/store?page=${page}&pageSize=10`, {
    tags: { endpoint: 'GET /store' },
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
