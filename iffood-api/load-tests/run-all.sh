#!/usr/bin/env bash
# =============================================================================
# run-all.sh — Executa todos os testes de carga k6 sequencialmente e salva
#              os resultados consolidados em JSON, organizados por cenário/teste.
#
# Uso:
#   cd iffood-api
#   ./load-tests/run-all.sh
#
# Variáveis de ambiente (definidas antes de chamar ou no .env.k6 na raiz):
#   K6_BASE_URL          — URL da API          (padrão: http://localhost:3006)
#   K6_AUTH_TOKEN        — "Bearer eyJ..."     (obrigatório para cenários 1 e 4)
#   K6_ORDER_TARGETS     — JSON array          (obrigatório para c1a, c4a, c4b)
#   K6_CONTENTION_TARGET — JSON objeto         (obrigatório para c1b)
#   K6_PRODUCT_IDS       — JSON array          (opcional para c3a, c3b)
#   K6_CONTENTION        — low | high          (opcional, padrão: low)
#   K6_ONLY              — nome(s) separados por vírgula para rodar apenas alguns
#                          Ex: K6_ONLY=c4a,c4b ./load-tests/run-all.sh
# =============================================================================

set -euo pipefail

# ── Cores ─────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()      { echo -e "${CYAN}[run-all]${RESET} $*"; }
ok()       { echo -e "${GREEN}[✓]${RESET} $*"; }
warn()     { echo -e "${YELLOW}[!]${RESET} $*"; }
fail()     { echo -e "${RED}[✗]${RESET} $*"; }
# Cool-down entre cenários: aguarda recuperação do pool de conexões do PostgreSQL
# após testes de alta contenção (c1b). Sem isso, o setup() do c2a pode pegar 500.
cooldown() {
  local secs="${1:-20}"
  log "Cool-down de ${secs}s — aguardando recuperação do pool de conexões PG..."
  sleep "$secs"
}

# ── Carregar .env.k6 se existir ───────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${ROOT_DIR}/.env.k6"

if [[ -f "$ENV_FILE" ]]; then
  log "Carregando variáveis de ${ENV_FILE}"
  set -a; source "$ENV_FILE"; set +a
fi

# ── Configuração ──────────────────────────────────────────────────────────────
BASE_URL="${K6_BASE_URL:-http://localhost:3006}"
RESULTS_BASE="${SCRIPT_DIR}/results"
TIMESTAMP=$(date +%Y%m%dT%H%M%S)
RESULTS_DIR="${RESULTS_BASE}/${TIMESTAMP}"
FINAL_JSON="${RESULTS_DIR}/all-results.json"

mkdir -p "$RESULTS_DIR"

# Filtro opcional: rodar apenas os testes listados em K6_ONLY
ONLY_FILTER="${K6_ONLY:-}"

# ── Rastrear execuções ────────────────────────────────────────────────────────
declare -A TEST_STATUS   # ok | skip | fail
declare -A TEST_REASON   # motivo do skip, se houver

# =============================================================================
# Funções auxiliares
# =============================================================================

# Verifica se um teste deve ser incluído (filtro K6_ONLY)
should_run() {
  local name="$1"
  [[ -z "$ONLY_FILTER" ]] && return 0
  IFS=',' read -ra only_list <<< "$ONLY_FILTER"
  for item in "${only_list[@]}"; do
    [[ "$item" == "$name" ]] && return 0
  done
  return 1
}

# Executa um teste k6 e salva o summary-export
# Uso: run_test <nome> <arquivo.js> [VAR=valor ...]
run_test() {
  local name="$1"
  local file="${SCRIPT_DIR}/${2}"
  shift 2
  local extra_env=("$@")
  local summary_file="${RESULTS_DIR}/${name}.json"

  if ! should_run "$name"; then
    warn "Pulando ${name} (não está em K6_ONLY='${ONLY_FILTER}')"
    TEST_STATUS["$name"]="skip"
    TEST_REASON["$name"]="filtrado por K6_ONLY"
    return
  fi

  log "Iniciando: ${BOLD}${name}${RESET}"

  local env_prefix=()
  for e in "${extra_env[@]}"; do
    env_prefix+=("$e")
  done

  local exit_code=0
  env "${env_prefix[@]}" k6 run \
    --summary-export="${summary_file}" \
    "$file" \
    || exit_code=$?

  if [[ $exit_code -eq 0 ]]; then
    ok "${name} concluído"
    TEST_STATUS["$name"]="ok"
  elif [[ $exit_code -eq 99 ]]; then
    # k6 retorna 99 quando thresholds falham mas o teste rodou
    warn "${name} concluído com thresholds violados (exit ${exit_code})"
    TEST_STATUS["$name"]="threshold_failed"
  else
    fail "${name} falhou (exit ${exit_code})"
    TEST_STATUS["$name"]="error"
  fi
}

# Pula um teste com motivo explícito
skip_test() {
  local name="$1"
  local reason="$2"
  warn "Pulando ${name}: ${reason}"
  TEST_STATUS["$name"]="skip"
  TEST_REASON["$name"]="$reason"
}

# =============================================================================
# Definição dos testes
# =============================================================================

log "Destino dos resultados: ${RESULTS_DIR}"
log "API alvo: ${BASE_URL}"
echo ""

# ── Cenário 1 — Lock Pessimista ───────────────────────────────────────────────
echo -e "${BOLD}── Cenário 1: Concorrência e Lock Pessimista ──────────────────${RESET}"

if [[ -z "${K6_AUTH_TOKEN:-}" || -z "${K6_ORDER_TARGETS:-}" ]]; then
  skip_test "c1a-low-contention" "K6_AUTH_TOKEN ou K6_ORDER_TARGETS não definidos"
else
  run_test "c1a-low-contention" "c1a-low-contention.js" \
    "K6_BASE_URL=${BASE_URL}" \
    "K6_AUTH_TOKEN=${K6_AUTH_TOKEN}" \
    "K6_ORDER_TARGETS=${K6_ORDER_TARGETS}"
fi

if [[ -z "${K6_AUTH_TOKEN:-}" || -z "${K6_CONTENTION_TARGET:-}" ]]; then
  skip_test "c1b-high-contention" "K6_AUTH_TOKEN ou K6_CONTENTION_TARGET não definidos"
else
  run_test "c1b-high-contention" "c1b-high-contention.js" \
    "K6_BASE_URL=${BASE_URL}" \
    "K6_AUTH_TOKEN=${K6_AUTH_TOKEN}" \
    "K6_CONTENTION_TARGET=${K6_CONTENTION_TARGET}"
fi

echo ""
cooldown 20

# ── Cenário 2 — Leitura sem/com Cache ────────────────────────────────────────
echo -e "${BOLD}── Cenário 2: Leitura Intensiva e Cache ───────────────────────${RESET}"

run_test "c2a-no-cache" "c2a-no-cache.js" \
  "K6_BASE_URL=${BASE_URL}"

run_test "c2b-with-cache" "c2b-with-cache.js" \
  "K6_BASE_URL=${BASE_URL}"

echo ""
cooldown 15

# ── Cenário 3 — Acoplamento de Dados ─────────────────────────────────────────
echo -e "${BOLD}── Cenário 3: Acoplamento de Dados ────────────────────────────${RESET}"

PRODUCT_IDS_ENV="${K6_PRODUCT_IDS:-}"
if [[ -n "$PRODUCT_IDS_ENV" ]]; then
  run_test "c3a-coupled-query" "c3a-coupled-query.js" \
    "K6_BASE_URL=${BASE_URL}" \
    "K6_PRODUCT_IDS=${PRODUCT_IDS_ENV}"
  run_test "c3b-decoupled-query" "c3b-decoupled-query.js" \
    "K6_BASE_URL=${BASE_URL}" \
    "K6_PRODUCT_IDS=${PRODUCT_IDS_ENV}"
else
  run_test "c3a-coupled-query" "c3a-coupled-query.js" \
    "K6_BASE_URL=${BASE_URL}"
  run_test "c3b-decoupled-query" "c3b-decoupled-query.js" \
    "K6_BASE_URL=${BASE_URL}"
fi

echo ""
cooldown 15

# ── Cenário 4 — Comunicação Síncrona vs Assíncrona ───────────────────────────
echo -e "${BOLD}── Cenário 4: Comunicação Síncrona vs Assíncrona ──────────────${RESET}"

if [[ -z "${K6_AUTH_TOKEN:-}" || -z "${K6_ORDER_TARGETS:-}" ]]; then
  skip_test "c4a-sync"  "K6_AUTH_TOKEN ou K6_ORDER_TARGETS não definidos"
  skip_test "c4b-async" "K6_AUTH_TOKEN ou K6_ORDER_TARGETS não definidos"
else
  CONTENTION="${K6_CONTENTION:-low}"
  run_test "c4a-sync" "c4a-sync.js" \
    "K6_BASE_URL=${BASE_URL}" \
    "K6_AUTH_TOKEN=${K6_AUTH_TOKEN}" \
    "K6_ORDER_TARGETS=${K6_ORDER_TARGETS}" \
    "K6_CONTENTION=${CONTENTION}"

  run_test "c4b-async" "c4b-async.js" \
    "K6_BASE_URL=${BASE_URL}" \
    "K6_AUTH_TOKEN=${K6_AUTH_TOKEN}" \
    "K6_ORDER_TARGETS=${K6_ORDER_TARGETS}" \
    "K6_CONTENTION=${CONTENTION}"
fi

echo ""

# =============================================================================
# Consolidar resultados em all-results.json
# =============================================================================

log "Consolidando resultados em ${FINAL_JSON}..."

node "${SCRIPT_DIR}/merge-results.js" \
  --dir="${RESULTS_DIR}" \
  --out="${FINAL_JSON}" \
  --timestamp="${TIMESTAMP}" \
  --base-url="${BASE_URL}"

# =============================================================================
# Sumário final no terminal
# =============================================================================

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD} Resultado da bateria de testes — ${TIMESTAMP}${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════════${RESET}"

ALL_TESTS=(
  "c1a-low-contention"
  "c1b-high-contention"
  "c2a-no-cache"
  "c2b-with-cache"
  "c3a-coupled-query"
  "c3b-decoupled-query"
  "c4a-sync"
  "c4b-async"
)

for t in "${ALL_TESTS[@]}"; do
  status="${TEST_STATUS[$t]:-unknown}"
  case "$status" in
    ok)               echo -e "  ${GREEN}✓ PASSOU   ${RESET} ${t}" ;;
    threshold_failed) echo -e "  ${YELLOW}⚠ THRESHOLD${RESET} ${t}" ;;
    skip)             echo -e "  ${CYAN}– PULADO   ${RESET} ${t} (${TEST_REASON[$t]:-})" ;;
    error)            echo -e "  ${RED}✗ ERRO     ${RESET} ${t}" ;;
    *)                echo -e "  ${YELLOW}? DESCONHECIDO${RESET} ${t}" ;;
  esac
done

echo ""
echo -e "  Resultados consolidados → ${BOLD}${FINAL_JSON}${RESET}"
echo ""
