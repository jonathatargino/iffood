/**
 * Métricas duplicadas por perfil de VU (10 / 50 / 100 / 150 / 200) para segmentação no
 * summary-export do k6 — submétricas por tag não aparecem no JSON exportado.
 *
 * Convenção de nomes (prefix = order_low_contention):
 *   {prefix}_latency_vu10 | _errors_vu10 | _requests_vu10
 */

import exec from 'k6/execution';
import { Trend, Rate, Counter } from 'k6/metrics';
import { CANONICAL_VUS } from './stages.js';

/** Perfil ativo: vu_10 → "10", vu_50 → "50", … */
export function vuProfileTag() {
  const name = exec.scenario?.name || '';
  return name.startsWith('vu_') ? name.slice(3) : null;
}

/**
 * Cria Trends/Rates/Counters por perfil de VU.
 * @param {string} prefix — ex.: store_list, order_low_contention, sync_order
 */
export function createVuProfileMetrics(prefix, opts = {}) {
  const { latency = true, errors = true, requests = true } = opts;
  const profiles = {};

  for (const vus of CANONICAL_VUS) {
    const key = String(vus);
    profiles[key] = {};
    if (latency) profiles[key].latency = new Trend(`${prefix}_latency_vu${vus}`, true);
    if (errors) profiles[key].errors = new Rate(`${prefix}_errors_vu${vus}`);
    if (requests) profiles[key].requests = new Counter(`${prefix}_requests_vu${vus}`);
  }

  return profiles;
}

/** Rates adicionais por perfil (ex.: async_accepted_rate_vu10). */
export function createVuProfileRates(namePrefix) {
  const rates = {};
  for (const vus of CANONICAL_VUS) {
    rates[String(vus)] = new Rate(`${namePrefix}_vu${vus}`);
  }
  return rates;
}

/** Registra latência, erro e contagem no perfil de VU ativo. */
export function recordVuProfileMetrics(profiles, { latencyMs, passed }) {
  const key = vuProfileTag();
  if (!key || !profiles[key]) return;

  const p = profiles[key];
  if (latencyMs !== undefined && p.latency) p.latency.add(latencyMs);
  if (passed !== undefined && p.errors) p.errors.add(!passed);
  if (p.requests) p.requests.add(1);
}

/** Registra valor booleano em Rate por perfil. */
export function recordVuProfileRate(ratesByProfile, value) {
  const key = vuProfileTag();
  if (!key || !ratesByProfile[key]) return;
  ratesByProfile[key].add(value);
}
