#!/usr/bin/env bash
# =============================================================================
# curl-async-order.sh — Testa POST /order-request/async (202 + SQS).
#
# Uso (na raiz iffood-api ou load-tests/):
#   ./load-tests/curl-async-order.sh
#
# Variáveis ( .env.k6 → .env → shell ):
#   K6_BASE_URL, K6_AUTH_TOKEN
#
# IDs padrão = loja/produto do load-tests/setup.js (primeiro ORDER_TARGET).
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "${ROOT_DIR}/.env.k6" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env.k6"
  set +a
fi
if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

BASE_URL="${K6_BASE_URL:-http://localhost:3006}"
BASE_URL="${BASE_URL%/}"
if [[ "$BASE_URL" != http://* && "$BASE_URL" != https://* ]]; then
  BASE_URL="http://${BASE_URL}"
fi

TOKEN="${K6_AUTH_TOKEN#Bearer }"
TOKEN="${TOKEN%%[[:space:]]*}"

if [[ -z "$TOKEN" ]]; then
  echo "[curl-async-order] ERRO: K6_AUTH_TOKEN não definido (.env.k6 ou .env)." >&2
  exit 1
fi

CART_ID="${CURL_ASYNC_CART_ID:-10000000-0000-4000-8000-000000000099}"
STORE_ID="${CURL_ASYNC_STORE_ID:-10000000-0000-4000-8000-000000000001}"
PRODUCT_ID="${CURL_ASYNC_PRODUCT_ID:-20000000-0001-4000-8000-000000000001}"
PRODUCT_OPTION_ID="${CURL_ASYNC_PRODUCT_OPTION_ID:-30000000-0001-4000-8000-000000000001}"

exec curl -sS -i -X POST "${BASE_URL}/order-request/async" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data-binary @- <<EOF
{"cartId":"${CART_ID}","storeId":"${STORE_ID}","items":[{"productId":"${PRODUCT_ID}","productOptionId":"${PRODUCT_OPTION_ID}","quantity":1}]}
EOF
