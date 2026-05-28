/**
 * Perfil canônico de carga — baseline idêntico para todos os cenários k6.
 *
 * Ramp-up: 0 → 10 → 50 → 100 VUs em 2m30s (TCC_LOAD_TESTING_PLAN.md).
 */

export const CANONICAL_VUS = [10, 50, 100];

export const CANONICAL_STAGES = [
  { duration: '30s', target: 10 },
  { duration: '30s', target: 50 },
  { duration: '60s', target: 100 },
  { duration: '30s', target: 0 },
];

export function formatStagesSummary() {
  return `${CANONICAL_VUS.join(' → ')} VUs em 2m30s`;
}

export function maxStageVUs(stages = CANONICAL_STAGES) {
  return Math.max(...stages.map((s) => s.target));
}

function parseDurationMs(d) {
  if (d.endsWith('s')) return parseInt(d, 10) * 1000;
  if (d.endsWith('m')) return parseInt(d, 10) * 60_000;
  return parseInt(d, 10) * 1000;
}

/**
 * Encontra a janela (offset + duração) do estágio com maior número de VUs.
 * Usado para logar os timestamps esperados da fase de pico (CloudWatch).
 */
export function computePeakWindow(stages) {
  let offset = 0;
  let maxTarget = 0;
  let peakStart = 0;
  let peakDuration = 0;
  for (const stage of stages) {
    const dur = parseDurationMs(stage.duration);
    if (stage.target > maxTarget) {
      maxTarget = stage.target;
      peakStart = offset;
      peakDuration = dur;
    }
    offset += dur;
  }
  return { peakStart, peakDuration };
}
