/**
 * Perfil canônico de carga — baseline idêntico para todos os cenários k6.
 *
 * Oito plateaus estáveis (50 → 100 → … → 400 VUs) com tag vu_profile
 * em cada scenario k6, permitindo segmentação de métricas no summary-export.
 *
 * Duração total: 4m00s (30s × 8).
 */

export const CANONICAL_VUS = [50, 100, 150, 200, 250, 300, 350, 400];

/** Duração de cada plateau por nível de VUs (segundos). */
export const VU_PROFILE_DURATIONS = Object.fromEntries(
  CANONICAL_VUS.map((vus) => [vus, '30s']),
);

/** Offsets cumulativos (ms) do início do teste — usados em merge-results e CloudWatch. */
export const VU_PROFILE_WINDOWS = (() => {
  const parseMs = (d) => (d.endsWith('s') ? parseInt(d, 10) * 1000 : parseInt(d, 10) * 1000);
  let offset = 0;
  const windows = {};
  for (const vus of CANONICAL_VUS) {
    const dur = parseMs(VU_PROFILE_DURATIONS[vus]);
    windows[String(vus)] = { offset_ms: offset, duration_ms: dur, vus };
    offset += dur;
  }
  return windows;
})();

/**
 * Scenarios k6 sequenciais — carga constante por perfil (sem ramp dentro do plateau).
 * A tag vu_profile propaga para submétricas no summary-export.
 */
export const CANONICAL_SCENARIOS = (() => {
  let startSec = 0;
  const scenarios = {};
  for (const vus of CANONICAL_VUS) {
    const duration = VU_PROFILE_DURATIONS[vus];
    const durSec = parseInt(duration, 10);
    scenarios[`vu_${vus}`] = {
      executor: 'constant-vus',
      vus,
      duration,
      startTime: `${startSec}s`,
      gracefulStop: '5s',
      tags: { vu_profile: String(vus) },
    };
    startSec += durSec;
  }
  return scenarios;
})();

/** @deprecated Use CANONICAL_SCENARIOS — mantido para referência em docs legados. */
export const CANONICAL_STAGES = CANONICAL_VUS.map((target) => ({
  duration: '30s',
  target,
}));

export function formatStagesSummary() {
  const parts = CANONICAL_VUS.map((v) => `${v} VUs@${VU_PROFILE_DURATIONS[v]}`);
  return `${parts.join(' → ')} (plateaus estáveis)`;
}

export function totalDurationMs() {
  return Object.values(VU_PROFILE_WINDOWS).reduce((sum, w) => sum + w.duration_ms, 0);
}

export function maxStageVUs() {
  return Math.max(...CANONICAL_VUS);
}

function parseDurationMs(d) {
  if (d.endsWith('s')) return parseInt(d, 10) * 1000;
  if (d.endsWith('m')) return parseInt(d, 10) * 60_000;
  return parseInt(d, 10) * 1000;
}

/**
 * Janela do perfil de maior carga (400 VUs) — correlação CloudWatch.
 */
export function computePeakWindow() {
  const peakVus = maxStageVUs();
  const peak = VU_PROFILE_WINDOWS[String(peakVus)];
  return {
    peakStart: peak.offset_ms,
    peakDuration: peak.duration_ms,
    peakVus: peak.vus,
  };
}

/** Opções k6 compartilhadas — scenarios + thresholds por script. */
export function buildCanonicalOptions(thresholds = {}, extra = {}) {
  return {
    scenarios: CANONICAL_SCENARIOS,
    thresholds,
    ...extra,
  };
}
