#!/usr/bin/env bash
# =============================================================================
# run-one.sh — Roda um ou mais testes k6 isolados (sem bateria completa).
#
# Por padrão executa reset do ambiente antes do k6 (evita efeito do teste anterior).
# Internamente chama run-all.sh (mesmo pipeline: k6 → análise worker c3b → merge).
#
# Uso:
#   ./load-tests/run-one.sh c3a
#   ./load-tests/run-one.sh c3a c3b
#   ./load-tests/run-one.sh 3
#   ./load-tests/run-one.sh --no-reset c3a    # pula limpeza (mais rápido, menos isolado)
#   npm run load:one -- c3a
#
# Atalhos: c1a…c3b, 1…3 (cenário inteiro), nomes completos (c3a-sync)
#
# Variáveis:
#   K6_RESET=0        — equivalente a --no-reset
#   K6_COOLDOWN=0|1   — pausas entre testes do mesmo comando (padrão: 0 se 1 teste)
#   K6_WORKER_ANALYSIS=0 — desliga análise automática do worker após c3b
#   K6_WORKER_DRAIN_MODE=skip — analyze sem esperar SQS (purge seguro depois)
#   K6_WORKER_PG_RETRY_MAX=15  K6_WORKER_PG_RETRY_SEC=12 — retry visível se pool PG cheio
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}[run-one]${RESET} $*"; }
warn() { echo -e "${YELLOW}[!]${RESET} $*"; }

usage() {
  cat <<'EOF'
Uso: ./load-tests/run-one.sh [--no-reset] <teste> [teste ...]

  --no-reset, -n   não executa setup.js antes do k6

Testes:
  c1a, c1b, c1c, c2a, c2b, c3a, c3b
  1 … 3  (cenário inteiro)

Exemplos:
  ./load-tests/run-one.sh c3a
  ./load-tests/run-one.sh --no-reset c3a
  ./load-tests/run-one.sh c3a c3b
  npm run load:one -- c3a
EOF
}

resolve_token() {
  local t="${1,,}"
  case "$t" in
    c1a|1a) echo "c1a-low-contention" ;;
    c1b|1b) echo "c1b-high-contention" ;;
    c1c|1c) echo "c1c-no-lock" ;;
    c2a|2a) echo "c2a-no-cache" ;;
    c2b|2b) echo "c2b-with-cache" ;;
    c3a|3a) echo "c3a-sync" ;;
    c3b|3b) echo "c3b-async" ;;
    c4a|4a) echo "c3a-sync" ;;
    c4b|4b) echo "c3b-async" ;;
    1|scenario1|s1) echo "c1a-low-contention,c1b-high-contention,c1c-no-lock" ;;
    2|scenario2|s2) echo "c2a-no-cache,c2b-with-cache" ;;
    3|scenario3|s3) echo "c3a-sync,c3b-async" ;;
    4|scenario4|s4) echo "c3a-sync,c3b-async" ;;
    c1a-low-contention|c1b-high-contention|c1c-no-lock|c2a-no-cache|c2b-with-cache|c3a-sync|c3b-async)
      echo "$1" ;;
    *) echo "" ;;
  esac
}

needs_full_reset() {
  for name in "$@"; do
    case "$name" in
      c2a-no-cache|c2b-with-cache)
        return 0
        ;;
    esac
  done
  return 1
}

SKIP_RESET=0
if [[ "${K6_RESET:-1}" == "0" ]]; then
  SKIP_RESET=1
fi

args=()
for arg in "$@"; do
  case "$arg" in
    --no-reset|-n) SKIP_RESET=1 ;;
    -h|--help) usage; exit 0 ;;
    *) args+=("$arg") ;;
  esac
done

if [[ ${#args[@]} -eq 0 ]]; then
  usage
  exit 1
fi

CANONICAL_ORDER=(
  c1a-low-contention
  c1b-high-contention
  c1c-no-lock
  c2a-no-cache
  c2b-with-cache
  c3a-sync
  c3b-async
)

declare -A WANTED=()
for arg in "${args[@]}"; do
  mapped=$(resolve_token "$arg")
  if [[ -z "$mapped" ]]; then
    echo "[run-one] Atalho desconhecido: ${arg}" >&2
    usage
    exit 1
  fi
  IFS=',' read -ra parts <<< "$mapped"
  for p in "${parts[@]}"; do
    WANTED["$p"]=1
  done
done

ordered=()
for name in "${CANONICAL_ORDER[@]}"; do
  [[ -n "${WANTED[$name]:-}" ]] && ordered+=("$name")
done

if [[ ${#ordered[@]} -eq 0 ]]; then
  echo "[run-one] Nenhum teste válido." >&2
  exit 1
fi

# ── Reset do ambiente (padrão ligado) ─────────────────────────────────────────
if [[ "$SKIP_RESET" -eq 0 ]]; then
  if needs_full_reset "${ordered[@]}"; then
    log "Reset completo (c2 exige lojas bulk)..."
    (cd "$ROOT_DIR" && node load-tests/setup.js)
  else
    log "Reset rápido (limpa pedidos, repõe estoque c1/c3, purge SQS/Redis)..."
    (cd "$ROOT_DIR" && node load-tests/setup.js --reset-quick)
  fi
else
  warn "Reset desligado — resultado pode refletir carga de testes anteriores."
fi

export K6_ONLY
K6_ONLY=$(IFS=,; echo "${ordered[*]}")

if [[ ${#ordered[@]} -eq 1 && -z "${K6_COOLDOWN:-}" ]]; then
  export K6_COOLDOWN=0
fi

log "Executando: ${K6_ONLY}"
exec "${SCRIPT_DIR}/run-all.sh"
