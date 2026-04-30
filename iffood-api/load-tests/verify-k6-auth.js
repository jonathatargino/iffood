#!/usr/bin/env node
'use strict';

/**
 * Valida K6_AUTH_TOKEN com uma requisição GET autenticada à API (sem efeitos colaterais).
 *
 * Endpoint: GET /store/me — exige AuthGuard (JWT Supabase); retorna lista de lojas do usuário (pode ser []).
 *
 * Fontes de URL e token (mesma ideia do run-all.sh, que faz source de .env.k6 na raiz):
 *   1) .env.k6 na raiz do iffood-api
 *   2) .env na raiz (fallback)
 *   3) variáveis de ambiente K6_BASE_URL / K6_AUTH_TOKEN já definidas
 *
 * Uso (na raiz iffood-api):
 *   node load-tests/verify-k6-auth.js
 *   K6_BASE_URL=http://127.0.0.1:3006 node load-tests/verify-k6-auth.js
 *
 * Códigos de saída: 0 = HTTP 200 na API, 1 = falha (rede, token, arquivo legado).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_APP = path.join(ROOT, '.env');
const ENV_K6_CANON = path.join(ROOT, '.env.k6');
const LEGACY_ENV_K6 = path.join(__dirname, '.env.k6');

let dotenv;
try {
  dotenv = require('dotenv');
} catch {
  console.error('[verify-k6-auth] Falha ao carregar dotenv (npm install).');
  process.exit(1);
}

function readParsed(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return dotenv.parse(fs.readFileSync(filePath));
  } catch (e) {
    console.error(`[verify-k6-auth] Erro ao ler ${filePath}: ${e.message}`);
    process.exit(1);
  }
}

/** JWT puro (sem prefixo Bearer), para montar Authorization: Bearer … */
function jwtOnly(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/^Bearer\s+/i, '').trim();
}

function authorizationHeader(raw) {
  const jwt = jwtOnly(raw);
  if (!jwt) return null;
  return `Bearer ${jwt}`;
}

function parseArgs(argv) {
  const out = { url: null, token: null };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--url=')) out.url = a.slice('--url='.length);
    else if (a.startsWith('--token=')) out.token = a.slice('--token='.length);
  }
  return out;
}

async function fetchWithTimeout(url, options, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const cli = parseArgs(process.argv);

  if (fs.existsSync(LEGACY_ENV_K6)) {
    console.error('[verify-k6-auth] ERRO: existe cópia ignorada pelo run-all.sh:');
    console.error(`  ${LEGACY_ENV_K6}`);
    console.error('  Apague esse arquivo; use apenas .env.k6 na raiz do iffood-api.');
    process.exit(1);
  }

  const app = readParsed(ENV_APP);
  const k6file = readParsed(ENV_K6_CANON);

  const baseUrl =
    cli.url ||
    process.env.K6_BASE_URL ||
    (k6file && k6file.K6_BASE_URL) ||
    (app && app.K6_BASE_URL) ||
    'http://localhost:3006';

  const tokenRaw =
    cli.token ||
    process.env.K6_AUTH_TOKEN ||
    (k6file && k6file.K6_AUTH_TOKEN) ||
    (app && app.K6_AUTH_TOKEN) ||
    '';

  const auth = authorizationHeader(tokenRaw);
  if (!auth) {
    console.error('[verify-k6-auth] ERRO: K6_AUTH_TOKEN não encontrado.');
    console.error('  Defina em .env.k6 (recomendado), em .env, ou passe --token=…');
    process.exit(1);
  }

  const base = String(baseUrl).replace(/\/+$/, '');
  const verifyUrl = `${base}/store/me`;

  const tokenFromK6 = k6file && k6file.K6_AUTH_TOKEN;
  const tokenFromApp = app && app.K6_AUTH_TOKEN;
  const source =
    cli.token
      ? 'argumento --token'
      : process.env.K6_AUTH_TOKEN
        ? 'variável de ambiente K6_AUTH_TOKEN'
        : tokenFromK6
          ? '.env.k6'
          : tokenFromApp
            ? '.env'
            : '?';

  console.log('[verify-k6-auth] GET /store/me (somente leitura, requer JWT válido)');
  console.log(`  URL:   ${verifyUrl}`);
  console.log(`  Token: ${source}`);
  console.log('');

  if (
    tokenFromApp &&
    tokenFromK6 &&
    jwtOnly(String(tokenFromApp)) !== jwtOnly(String(tokenFromK6))
  ) {
    console.warn('[verify-k6-auth] Aviso: K6_AUTH_TOKEN em .env difere de .env.k6.');
    console.warn('  O teste HTTP usa o token efetivo listado acima; alinhe os arquivos ou rode setup.js.');
    console.warn('');
  }

  let res;
  try {
    res = await fetchWithTimeout(
      verifyUrl,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: auth,
        },
      },
      15_000,
    );
  } catch (e) {
    const msg = e && e.name === 'AbortError' ? 'timeout 15s' : e.message;
    console.error(`[verify-k6-auth] ERRO de rede: ${msg}`);
    console.error(`  Confira se a API está no ar em ${base}`);
    process.exit(1);
  }

  const bodyText = await res.text();
  let preview = bodyText;
  if (preview.length > 200) preview = `${preview.slice(0, 200)}…`;

  if (res.status === 200) {
    console.log(`[verify-k6-auth] OK — HTTP ${res.status} (token aceito pela API).`);
    if (preview) console.log(`  Corpo: ${preview}`);
    process.exit(0);
  }

  console.error(`[verify-k6-auth] ERRO — HTTP ${res.status}`);
  console.error(`  Resposta: ${preview || '(vazio)'}`);
  if (res.status === 401 || res.status === 403) {
    console.error('  Token inválido, expirado ou rejeitado pelo AuthGuard.');
  }
  process.exit(1);
}

main().catch((e) => {
  console.error('[verify-k6-auth] ERRO inesperado:', e);
  process.exit(1);
});
