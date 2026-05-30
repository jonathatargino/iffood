#!/usr/bin/env bash
# =============================================================================
# run-all.sh — Executa testes de carga k6 e salva resultados consolidados em JSON.
#
# Uso:
#   ./load-tests/run-all.sh                    # bateria completa (6 testes)
#   ./load-tests/run-one.sh c3a                # um teste (recomendado)
#   K6_ONLY=c3a-sync ./load-tests/run-all.sh   # filtro manual
#
# Variáveis de ambiente (.env.k6 na raiz ou export):
#   K6_BASE_URL, K6_AUTH_TOKEN, K6_ORDER_TARGETS, K6_CONTENTION_TARGET,
#   K6_CONTENTION
#   K6_ONLY     — nomes completos ou atalhos (c3a,c3b,3) separados por vírgula
#   K6_COOLDOWN — 1 força pausas entre cenários; 0 pula (run-one usa 0 para 1 teste)
#
# Correlação CloudWatch: test-windows.json com started_at/ended_at por teste.
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()      { echo -e "${CYAN}[run-all]${RESET} $*"; }
ok()       { echo -e "${GREEN}[✓]${RESET} $*"; }
warn()     { echo -e "${YELLOW}[!]${RESET} $*"; }
fail()     { echo -e "${RED}[✗]${RESET} $*"; }

cooldown() {
  [[ "${K6_COOLDOWN:-1}" == "0" ]] && return 0
  local secs="${1:-20}"
  log "Cool-down de ${secs}s — recuperação do pool PG..."
  sleep "$secs"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${ROOT_DIR}/.env.k6"

if [[ -f "$ENV_FILE" ]]; then
  log "Carregando variáveis de ${ENV_FILE}"
  set -a; source "$ENV_FILE"; set +a
fi

BASE_URL="${K6_BASE_URL:-http://localhost:3006}"
if [[ "$BASE_URL" != http://* && "$BASE_URL" != https://* ]]; then
  warn "K6_BASE_URL sem http(s):// — usando http://${BASE_URL}"
  BASE_URL="http://${BASE_URL}"
fi
BASE_URL="${BASE_URL%/}"
RESULTS_BASE="${SCRIPT_DIR}/results"
TIMESTAMP=$(date +%Y%m%dT%H%M%S)
RESULTS_DIR="${RESULTS_BASE}/${TIMESTAMP}"
FINAL_JSON="${RESULTS_DIR}/all-results.json"
WINDOWS_JSON="${RESULTS_DIR}/test-windows.json"
NDJSON_WINDOWS="${RESULTS_DIR}/.test-windows.ndjson"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-west-2}}"

mkdir -p "$RESULTS_DIR"
: > "$NDJSON_WINDOWS"

utc_iso_ms() { date -u +"%Y-%m-%dT%H:%M:%S.%3NZ"; }
utc_epoch_ms() { date -u +%s%3N; }

BATCH_STARTED_AT=$(utc_iso_ms)
BATCH_STARTED_EPOCH_MS=$(utc_epoch_ms)

declare -A TEST_STATUS
declare -A TEST_REASON

CANONICAL_ORDER=(
  c1a-low-contention
  c1b-high-contention
  c2a-no-cache
  c2b-with-cache
  c3a-sync
  c3b-async
)

# ── Resolver atalhos K6_ONLY ───────────────────────────────────────────────────
resolve_only_token() {
  local t="${1,,}"
  case "$t" in
    c1a|1a) echo "c1a-low-contention" ;;
    c1b|1b) echo "c1b-high-contention" ;;
    c2a|2a) echo "c2a-no-cache" ;;
    c2b|2b) echo "c2b-with-cache" ;;
    c3a|3a) echo "c3a-sync" ;;
    c3b|3b) echo "c3b-async" ;;
    # aliases legados (antigo cenário 4)
    c4a|4a) echo "c3a-sync" ;;
    c4b|4b) echo "c3b-async" ;;
    1|scenario1|s1) echo "c1a-low-contention,c1b-high-contention" ;;
    2|scenario2|s2) echo "c2a-no-cache,c2b-with-cache" ;;
    3|scenario3|s3) echo "c3a-sync,c3b-async" ;;
    4|scenario4|s4) echo "c3a-sync,c3b-async" ;;
    c1a-low-contention|c1b-high-contention|c2a-no-cache|c2b-with-cache|c3a-sync|c3b-async)
      echo "$1" ;;
    c4a-sync) echo "c3a-sync" ;;
    c4b-async) echo "c3b-async" ;;
    *) echo "" ;;
  esac
}

build_run_list() {
  RUN_LIST=()
  local only="${K6_ONLY:-}"
  [[ -z "$only" ]] && RUN_LIST=("${CANONICAL_ORDER[@]}") && return 0

  declare -A wanted=()
  IFS=',' read -ra tokens <<< "$only"
  for raw in "${tokens[@]}"; do
    raw="${raw// /}"
    [[ -z "$raw" ]] && continue
    mapped=$(resolve_only_token "$raw")
    if [[ -z "$mapped" ]]; then
      warn "K6_ONLY: token desconhecido '${raw}' (ignorado)"
      continue
    fi
    IFS=',' read -ra parts <<< "$mapped"
    for p in "${parts[@]}"; do
      wanted["$p"]=1
    done
  done

  for name in "${CANONICAL_ORDER[@]}"; do
    [[ -n "${wanted[$name]:-}" ]] && RUN_LIST+=("$name")
  done

  if [[ ${#RUN_LIST[@]} -eq 0 ]]; then
    fail "K6_ONLY não resolveu para nenhum teste válido: '${only}'"
    exit 1
  fi
}

scenario_for_test() {
  case "$1" in
    c1a*|c1b*) echo 1 ;;
    c2a*|c2b*) echo 2 ;;
    c3a*|c3b*) echo 3 ;;
    *) echo "" ;;
  esac
}

cooldown_between_tests() {
  local prev="$1" curr="$2"
  [[ -z "$prev" ]] && return 0
  local ps cs
  ps=$(scenario_for_test "$prev")
  cs=$(scenario_for_test "$curr")
  case "${ps}:${cs}" in
    1:2) cooldown 20 ;;
    2:3) cooldown 15 ;;
  esac
}

append_test_window() {
  local name="$1" status="$2" exit_code="$3"
  local started_at="$4" ended_at="$5" start_ms="$6" end_ms="$7"
  local scenario
  scenario=$(scenario_for_test "$name")
  node -e "
    const fs = require('fs');
    const s = process.argv[6] === '' ? null : Number(process.argv[6]);
    const e = process.argv[7] === '' ? null : Number(process.argv[7]);
    const row = {
      name: process.argv[1],
      scenario: process.argv[2] === '' ? null : Number(process.argv[2]),
      status: process.argv[3],
      exit_code: process.argv[4] === '' ? null : Number(process.argv[4]),
      started_at: process.argv[5] || null,
      ended_at: process.argv[8] || null,
      started_at_epoch_ms: s,
      ended_at_epoch_ms: e,
      duration_ms: s != null && e != null ? e - s : null,
    };
    fs.appendFileSync(process.argv[9], JSON.stringify(row) + '\n');
  " "$name" "$scenario" "$status" "$exit_code" "$started_at" "$start_ms" "$end_ms" "$ended_at" "$NDJSON_WINDOWS"
}

print_cloudwatch_table() {
  [[ ! -f "$WINDOWS_JSON" ]] && return
  node -e "
    const w = require(process.argv[1]);
    console.log('');
    console.log('── Janelas CloudWatch (UTC) ───────────────────────────────────');
    if (w.batch?.started_at) {
      console.log('  Bateria: ' + w.batch.started_at + ' → ' + w.batch.ended_at);
    }
    console.log('');
    for (const [name, t] of Object.entries(w.tests || {})) {
      if (!t.started_at) {
        console.log('  – ' + name.padEnd(24) + ' (pulado)');
        continue;
      }
      const sec = t.duration_ms != null ? (t.duration_ms / 1000).toFixed(1) + 's' : '?';
      console.log('  • ' + name.padEnd(24) + t.started_at + ' → ' + t.ended_at + ' (' + sec + ')');
    }
    console.log('');
    console.log('  Região sugerida: ' + process.argv[2]);
    console.log('');
  " "$WINDOWS_JSON" "$AWS_REGION"
}

run_test() {
  local name="$1"
  local file="${SCRIPT_DIR}/${2}"
  shift 2
  local extra_env=("$@")
  local summary_file="${RESULTS_DIR}/${name}.json"

  local started_at ended_at start_ms end_ms
  started_at=$(utc_iso_ms)
  start_ms=$(utc_epoch_ms)

  log "Iniciando: ${BOLD}${name}${RESET}"
  log "  CloudWatch início (UTC): ${started_at}"

  local env_prefix=()
  for e in "${extra_env[@]}"; do
    env_prefix+=("$e")
  done
  env_prefix+=("K6_RUN_ID=${TIMESTAMP}" "K6_TEST_NAME=${name}")

  local exit_code=0
  env "${env_prefix[@]}" k6 run \
    --summary-export="${summary_file}" \
    "$file" \
    || exit_code=$?

  ended_at=$(utc_iso_ms)
  end_ms=$(utc_epoch_ms)
  local duration_s
  duration_s=$(awk "BEGIN { printf \"%.1f\", (${end_ms} - ${start_ms}) / 1000 }")

  if [[ $exit_code -eq 0 ]]; then
    ok "${name} concluído (${duration_s}s)"
    TEST_STATUS["$name"]="ok"
  elif [[ $exit_code -eq 99 ]]; then
    warn "${name} thresholds violados (exit ${exit_code}, ${duration_s}s)"
    TEST_STATUS["$name"]="threshold_failed"
  else
    fail "${name} falhou (exit ${exit_code}, ${duration_s}s)"
    TEST_STATUS["$name"]="error"
  fi

  log "  CloudWatch fim (UTC):    ${ended_at}"
  append_test_window "$name" "${TEST_STATUS[$name]}" "$exit_code" \
    "$started_at" "$ended_at" "$start_ms" "$end_ms"
}

skip_test() {
  local name="$1"
  local reason="$2"
  warn "Pulando ${name}: ${reason}"
  TEST_STATUS["$name"]="skip"
  TEST_REASON["$name"]="$reason"
  append_test_window "$name" "skip" "" "" "" "" ""
}

execute_test() {
  local name="$1"
  case "$name" in
    c1a-low-contention)
      if [[ -z "${K6_AUTH_TOKEN:-}" || -z "${K6_ORDER_TARGETS:-}" ]]; then
        skip_test "$name" "K6_AUTH_TOKEN ou K6_ORDER_TARGETS não definidos"
      else
        run_test "$name" "c1a-low-contention.js" \
          "K6_BASE_URL=${BASE_URL}" \
          "K6_AUTH_TOKEN=${K6_AUTH_TOKEN}" \
          "K6_ORDER_TARGETS=${K6_ORDER_TARGETS}"
      fi
      ;;
    c1b-high-contention)
      if [[ -z "${K6_AUTH_TOKEN:-}" || -z "${K6_CONTENTION_TARGET:-}" ]]; then
        skip_test "$name" "K6_AUTH_TOKEN ou K6_CONTENTION_TARGET não definidos"
      else
        run_test "$name" "c1b-high-contention.js" \
          "K6_BASE_URL=${BASE_URL}" \
          "K6_AUTH_TOKEN=${K6_AUTH_TOKEN}" \
          "K6_CONTENTION_TARGET=${K6_CONTENTION_TARGET}"
      fi
      ;;
    c2a-no-cache)
      run_test "$name" "c2a-no-cache.js" "K6_BASE_URL=${BASE_URL}"
      ;;
    c2b-with-cache)
      run_test "$name" "c2b-with-cache.js" "K6_BASE_URL=${BASE_URL}"
      ;;
    c3a-sync)
      if [[ -z "${K6_AUTH_TOKEN:-}" || -z "${K6_ORDER_TARGETS:-}" ]]; then
        skip_test "$name" "K6_AUTH_TOKEN ou K6_ORDER_TARGETS não definidos"
      else
        run_test "$name" "c3a-sync.js" \
          "K6_BASE_URL=${BASE_URL}" \
          "K6_AUTH_TOKEN=${K6_AUTH_TOKEN}" \
          "K6_ORDER_TARGETS=${K6_ORDER_TARGETS}" \
          "K6_CONTENTION=${K6_CONTENTION:-low}"
      fi
      ;;
    c3b-async)
      if [[ -z "${K6_AUTH_TOKEN:-}" || -z "${K6_ORDER_TARGETS:-}" ]]; then
        skip_test "$name" "K6_AUTH_TOKEN ou K6_ORDER_TARGETS não definidos"
      else
        run_test "$name" "c3b-async.js" \
          "K6_BASE_URL=${BASE_URL}" \
          "K6_AUTH_TOKEN=${K6_AUTH_TOKEN}" \
          "K6_ORDER_TARGETS=${K6_ORDER_TARGETS}" \
          "K6_CONTENTION=${K6_CONTENTION:-low}"
      fi
      ;;
    *)
      fail "Teste desconhecido: ${name}"
      ;;
  esac
}

scenario_heading() {
  case "$1" in
    1) echo "Cenário 1: Concorrência e Lock Pessimista" ;;
    2) echo "Cenário 2: Leitura Intensiva e Cache" ;;
    3) echo "Cenário 3: Comunicação Síncrona vs Assíncrona" ;;
  esac
}

# =============================================================================
# Main
# =============================================================================

build_run_list

log "Destino dos resultados: ${RESULTS_DIR}"
log "API alvo: ${BASE_URL}"
if [[ -n "${K6_ONLY:-}" ]]; then
  log "Modo filtrado: ${#RUN_LIST[@]} teste(s) → ${RUN_LIST[*]}"
  [[ "${K6_COOLDOWN:-1}" == "0" ]] && log "Cool-downs entre cenários: desligados (K6_COOLDOWN=0)"
else
  log "Modo bateria completa (${#RUN_LIST[@]} testes)"
fi
echo ""

prev_test=""
last_scenario=""
for name in "${RUN_LIST[@]}"; do
  cooldown_between_tests "$prev_test" "$name"
  sc=$(scenario_for_test "$name")
  if [[ "$sc" != "$last_scenario" ]]; then
    echo -e "${BOLD}── $(scenario_heading "$sc") ──────────────────${RESET}"
    last_scenario="$sc"
  fi
  execute_test "$name"
  echo ""
  prev_test="$name"
done

BATCH_ENDED_AT=$(utc_iso_ms)
BATCH_ENDED_EPOCH_MS=$(utc_epoch_ms)

log "Gerando ${WINDOWS_JSON}..."
node "${SCRIPT_DIR}/emit-test-windows.js" \
  --out="${WINDOWS_JSON}" \
  --run-id="${TIMESTAMP}" \
  --batch-started-at="${BATCH_STARTED_AT}" \
  --batch-started-epoch-ms="${BATCH_STARTED_EPOCH_MS}" \
  --batch-ended-at="${BATCH_ENDED_AT}" \
  --batch-ended-epoch-ms="${BATCH_ENDED_EPOCH_MS}" \
  --ndjson="${NDJSON_WINDOWS}"

print_cloudwatch_table

log "Consolidando ${FINAL_JSON}..."
node "${SCRIPT_DIR}/merge-results.js" \
  --dir="${RESULTS_DIR}" \
  --out="${FINAL_JSON}" \
  --timestamp="${TIMESTAMP}" \
  --base-url="${BASE_URL}"

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD} Resultado — ${TIMESTAMP}${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${RESET}"

for t in "${RUN_LIST[@]}"; do
  status="${TEST_STATUS[$t]:-unknown}"
  case "$status" in
    ok)               echo -e "  ${GREEN}✓ PASSOU   ${RESET} ${t}" ;;
    threshold_failed) echo -e "  ${YELLOW}⚠ THRESHOLD${RESET} ${t}" ;;
    skip)             echo -e "  ${CYAN}– PULADO   ${RESET} ${t} (${TEST_REASON[$t]:-})" ;;
    error)            echo -e "  ${RED}✗ ERRO     ${RESET} ${t}" ;;
    *)                echo -e "  ${YELLOW}?          ${RESET} ${t}" ;;
  esac
done

echo ""
echo -e "  Consolidado → ${BOLD}${FINAL_JSON}${RESET}"
echo -e "  CloudWatch  → ${BOLD}${WINDOWS_JSON}${RESET}"
echo ""
