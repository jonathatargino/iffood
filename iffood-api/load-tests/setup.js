#!/usr/bin/env node
'use strict';

/**
 * load-tests/setup.js
 *
 * Coloca o banco em estado determinístico e gera iffood-api/.env.k6 com os IDs
 * fixos e token necessários para os 6 testes k6 rodarem com total reprodutibilidade.
 *
 * PRINCÍPIOS DE DESIGN:
 *   - UUIDs fixos → .env.k6 idêntico em toda execução
 *   - Limpeza total antes da repopulação → estado inicial sempre igual
 *   - SQL direto → sem dependência de S3, sem latência de upload
 *   - Estoque resetado a 500/execução → testes não esgotam stock entre rodadas
 *   - ANALYZE após bulk inserts → otimizador PostgreSQL usa planos corretos
 *   - Purge de SQS e Redis → isolamento total do Cenário 3 (sync vs async)
 *
 * Uso:
 *   node load-tests/setup.js              # setup completo (banco + .env.k6)
 *   node load-tests/setup.js --reset-quick  # só loja c1/c3: limpa pedidos, repõe estoque, SQS/Redis
 *
 * Variáveis de ambiente (lidas do .env da raiz ou do shell):
 *
 *   Obrigatórias:
 *     K6_AUTH_TOKEN   — "Bearer eyJ..." do usuário de teste
 *     DB_URL          — connection string PostgreSQL
 *
 *   Opcionais:
 *     K6_BASE_URL                   — URL da API       (padrão: http://localhost:3006)
 *     LOAD_TEST_ORDER_TARGETS_COUNT — produtos c1/c4   (padrão: 400)
 *     LOAD_TEST_STORE_COUNT         — lojas bulk c2    (padrão: 10000)
 *     REDIS_URL / REDIS_HOST        — flush do cache (standalone ou cluster)
 *     REDIS_CLUSTER=true            — ElastiCache Valkey (clustercfg.*)
 *     REDIS_PORT                    — default 6379
 *     REDIS_TLS=true                — obrigatório na AWS se in-transit encryption
 *     REDIS_PASSWORD                — se AUTH habilitado no ElastiCache
 *     LOAD_TEST_SKIP_REDIS_FLUSH=1  — pula flush (ElastiCache só na VPC / sem acesso)
 *     LOAD_TEST_REDIS_FLUSH_MODE    — scan (padrão cluster) | flushdb | flushall
 *     LOAD_TEST_REDIS_CONNECT_MS    — timeout de conexão (padrão: 10000)
 *     LOAD_TEST_SETUP_STATEMENT_TIMEOUT_MS — timeout SQL na limpeza (padrão: 600000 = 10min)
 *     SQS_QUEUE_URL                 — para purge da fila
 *     AWS_DEFAULT_REGION / AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 *
 *   Produção / fila AWS já criada na consola:
 *     — Não usa sqs:CreateQueue (só LocalStack chama createQueue).
 *     — Purge usa sqs:PurgeQueue na URL; falhas por IAM ou throttle são ignoradas com aviso.
 *     LOAD_TEST_SKIP_SQS_PURGE=1 — não executa purge (fila partilhada ou sem permissão).
 */

const path = require('path');
const fs   = require('fs');
const { Client } = require('pg');

// ── Carrega .env da raiz ───────────────────────────────────────────────────────
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch { /* usa env do shell */ }

// ── Configuração ──────────────────────────────────────────────────────────────
function normalizeBaseUrl(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return 'http://localhost:3006';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }
  return `http://${trimmed.replace(/\/+$/, '')}`;
}

const BASE_URL = normalizeBaseUrl(process.env.K6_BASE_URL);
const DB_URL   = process.env.DB_URL        || '';
const TOKEN    = process.env.K6_AUTH_TOKEN || '';

const ORDER_TARGETS_COUNT   = parseInt(process.env.LOAD_TEST_ORDER_TARGETS_COUNT  || '400',   10);
const BULK_STORE_COUNT      = parseInt(process.env.LOAD_TEST_STORE_COUNT          || '10000', 10);
const BULK_BATCH_SIZE       = 500;

const PRODUCT_OPTION_QUANTITY = 500; // máximo do CHECK constraint
const PLACEHOLDER_PHOTO_URL   = 'https://example.com/load-test-placeholder.png';
const OUT_FILE                = path.join(__dirname, '..', '.env.k6'); // raiz (onde run-all.sh espera)

// ── UUIDs fixos — .env.k6 idêntico em toda execução ──────────────────────────
const TEST_STORE_ID = '10000000-0000-4000-8000-000000000001';

/** Loja histórica do antigo cenário de acoplamento — removida; só limpamos se existir. */
const LEGACY_HISTORICAL_STORE_ID = '10000000-0000-4000-8000-000000000002';

function orderTargetIds(i) {
  const hex = i.toString(16).padStart(4, '0');
  return {
    productId:       `20000000-${hex}-4000-8000-000000000001`,
    productOptionId: `30000000-${hex}-4000-8000-000000000001`,
  };
}

const SEED_STORE_NAME  = '__load-test__';
const BULK_STORE_LABEL = '__bulk__';

// ── Log ───────────────────────────────────────────────────────────────────────
const G = '\x1b[32m', Y = '\x1b[33m', R = '\x1b[31m', C = '\x1b[36m', B = '\x1b[1m', X = '\x1b[0m';
const log  = (m) => console.log(`${C}[setup]${X} ${m}`);
const ok   = (m) => console.log(`${G}[✓]${X}    ${m}`);
const warn = (m) => console.warn(`${Y}[!]${X}    ${m}`);
const fail = (m) => { console.error(`${R}[✗]${X}    ${m}`); process.exit(1); };

function decodeJwt(token) {
  const jwt = token.replace(/^Bearer\s+/i, '');
  const [, payload] = jwt.split('.');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

// ── 1. Limpeza total (ordem respeita FKs) ─────────────────────────────────────

/** Supabase/RDS costumam ter statement_timeout baixo; a limpeza pós–load test é pesada. */
async function configureSetupSession(client) {
  const timeoutMs = parseInt(
    process.env.LOAD_TEST_SETUP_STATEMENT_TIMEOUT_MS || '600000',
    10,
  );
  await client.query(`SET statement_timeout = ${timeoutMs}`);
  await client.query(`SET lock_timeout = '60s'`);
  log(
    `PostgreSQL: statement_timeout=${timeoutMs}ms (${(timeoutMs / 60000).toFixed(1)} min), lock_timeout=60s`,
  );
}

async function runCleanupQuery(client, label, text, params = []) {
  const t0 = Date.now();
  log(`  ${label}...`);
  const res = await client.query(text, params);
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  ok(`  ${label} — ${res.rowCount ?? 0} linha(s) em ${sec}s`);
  return res;
}

async function cleanStoreData(client, storeId, storeLabel) {
  log(`Loja ${storeLabel} (${storeId})...`);

  await runCleanupQuery(
    client,
    'reviews',
    `
    DELETE FROM reviews
    WHERE review_request_id IN (
      SELECT rr.id FROM review_requests rr
      JOIN order_requests orq ON orq.id = rr.order_request_id
      WHERE orq.store_id = $1
    )
  `,
    [storeId],
  );

  await runCleanupQuery(
    client,
    'review_requests',
    `
    DELETE FROM review_requests
    WHERE order_request_id IN (SELECT id FROM order_requests WHERE store_id = $1)
  `,
    [storeId],
  );

  await runCleanupQuery(
    client,
    'order_request_items',
    `
    DELETE FROM order_request_items
    WHERE order_request_id IN (SELECT id FROM order_requests WHERE store_id = $1)
  `,
    [storeId],
  );

  await runCleanupQuery(
    client,
    'order_requests',
    'DELETE FROM order_requests WHERE store_id = $1',
    [storeId],
  );

  await runCleanupQuery(
    client,
    'store_users',
    'DELETE FROM store_users WHERE store_id = $1',
    [storeId],
  );

  await runCleanupQuery(
    client,
    'store_availabilities',
    'DELETE FROM store_availabilities WHERE store_id = $1',
    [storeId],
  );

  await runCleanupQuery(
    client,
    'product_options',
    `
    DELETE FROM product_options
    WHERE product_id IN (SELECT id FROM products WHERE store_id = $1)
  `,
    [storeId],
  );

  await runCleanupQuery(
    client,
    'products',
    'DELETE FROM products WHERE store_id = $1',
    [storeId],
  );

  await runCleanupQuery(
    client,
    'stores',
    'DELETE FROM stores WHERE id = $1',
    [storeId],
  );
}

/** 10k lojas bulk — DELETE em lotes para não estourar statement_timeout. */
async function deleteBulkStores(client) {
  const pattern = `${BULK_STORE_LABEL}%`;
  let total = 0;
  let batch = 0;

  while (true) {
    batch += 1;
    const t0 = Date.now();
    const res = await client.query(
      `
      DELETE FROM stores
      WHERE id IN (
        SELECT id FROM stores WHERE name LIKE $1 LIMIT 500
      )
    `,
      [pattern],
    );
    if (res.rowCount === 0) break;
    total += res.rowCount;
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    log(`  bulk stores lote ${batch}: +${res.rowCount} (total ${total}) em ${sec}s`);
  }

  ok(`bulk stores — ${total} loja(s) removidas em ${batch - 1} lote(s)`);
}

async function cleanAll(client) {
  log('Limpando dados de teste anteriores...');
  await configureSetupSession(client);

  await cleanStoreData(client, TEST_STORE_ID, 'principal (c1/c2/c3)');
  await cleanStoreData(client, LEGACY_HISTORICAL_STORE_ID, 'histórica (legado)');

  await deleteBulkStores(client);

  ok('Limpeza concluída.');
}

// ── 2. Purge de infraestrutura de mensageria ──────────────────────────────────
async function purgeQueues() {
  // SQS
  const sqsUrl = process.env.SQS_QUEUE_URL || '';
  if (sqsUrl) {
    const skipPurge = /^(1|true|yes)$/i.test(process.env.LOAD_TEST_SKIP_SQS_PURGE || '');
    if (skipPurge) {
      warn('LOAD_TEST_SKIP_SQS_PURGE — pulando purge da fila SQS (produção / fila partilhada).');
    } else {
      try {
        const AWS = require('aws-sdk');
        const isAwsHosted = sqsUrl.includes('amazonaws.com');
        const region =
          process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

        let sqs;
        if (isAwsHosted) {
          sqs = new AWS.SQS({
            region,
          });
          log(`Purgando fila SQS na AWS (sem createQueue — fila já existe na conta): ${sqsUrl}`);
          await sqs.purgeQueue({ QueueUrl: sqsUrl }).promise();
          ok('Fila SQS purgada (AWS).');
        } else {
          // LocalStack / dev: endpoint = origem da URL (localhost:4566, host.docker.internal:4566, …)
          let endpoint = 'http://localhost:4566';
          try {
            if (sqsUrl.startsWith('http')) endpoint = new URL(sqsUrl).origin;
          } catch {
            /* mantém default */
          }
          sqs = new AWS.SQS({
            endpoint,
            region: 'us-east-1',
            accessKeyId: 'test',
            secretAccessKey: 'test',
          });
          const queueName = sqsUrl.split('/').pop();
          log(`Garantindo existência da fila SQS (LocalStack): ${queueName}...`);
          await sqs.createQueue({ QueueName: queueName }).promise();
          log(`Purgando fila SQS: ${sqsUrl}...`);
          await sqs.purgeQueue({ QueueUrl: sqsUrl }).promise();
          ok('Fila SQS criada/verificada e purgada.');
        }
      } catch (err) {
        warn(`SQS setup falhou (${err.message}) — continuando.`);
      }
    }
  } else {
    warn('SQS_QUEUE_URL não definido — pulando setup da fila.');
  }

  // Redis (standalone ou ElastiCache Cluster)
  await purgeRedisCache(process.env);
}

const STORE_CACHE_KEY_PATTERN = '{store}:list*';
const DEFAULT_REDIS_CONNECT_MS = 10_000;
const DEFAULT_REDIS_COMMAND_MS = 20_000;

function isElastiCacheClusterEndpoint(host) {
  return host.startsWith('clustercfg.');
}

/** Espelha resolveRedisConfig (src/infra/redis/redis.client.ts) para o script de setup. */
function resolveRedisEnv(env) {
  let cluster = env.REDIS_CLUSTER === 'true' || env.REDIS_CLUSTER === '1';
  let host = env.REDIS_HOST?.trim();
  let port = parseInt(env.REDIS_PORT || '6379', 10);
  let password = env.REDIS_PASSWORD?.trim() || undefined;
  let tls = env.REDIS_TLS === 'true' || env.REDIS_TLS === '1';
  const hints = [];

  if (!host && env.REDIS_URL) {
    try {
      const parsed = new URL(env.REDIS_URL);
      host = parsed.hostname;
      port = parseInt(parsed.port || '6379', 10);
      if (!password && parsed.password) password = parsed.password;
      if (!tls && parsed.protocol === 'rediss:') tls = true;
    } catch {
      return null;
    }
  }

  if (!host) return null;

  if (isElastiCacheClusterEndpoint(host)) {
    if (env.REDIS_CLUSTER === 'false') {
      hints.push('REDIS_CLUSTER=false ignorado (host clustercfg.* exige cluster)');
    }
    if (!cluster) hints.push('cluster=true inferido de clustercfg.*');
    cluster = true;
  }

  const username = env.REDIS_USERNAME?.trim() || undefined;

  return { cluster, host, port, username, password, tls, hints };
}

function buildTlsOptions(host) {
  return {
    servername: host,
    checkServerIdentity: () => undefined,
  };
}

/**
 * Mesmas opções do teste manual que retorna PONG no ElastiCache (TLS + clustercfg).
 * Evita lazyConnect/clusterRetryStrategy:null no cluster — causavam "startup nodes unavailable".
 */
function createRedisForSetup(IORedis, cfg) {
  const connectMs = parseInt(envConnectMs(), 10);
  const tlsOpts = cfg.tls ? buildTlsOptions(cfg.host) : undefined;

  const sharedNodeOptions = {
    connectTimeout: connectMs,
    commandTimeout: DEFAULT_REDIS_COMMAND_MS,
    family: 4,
    ...(cfg.username ? { username: cfg.username } : {}),
    ...(cfg.password ? { password: cfg.password } : {}),
    ...(tlsOpts ? { tls: tlsOpts } : {}),
  };

  if (cfg.cluster) {
    return new IORedis.Cluster([{ host: cfg.host, port: cfg.port }], {
      dnsLookup: (address, callback) => callback(null, address),
      enableReadyCheck: false,
      slotsRefreshTimeout: connectMs,
      slotsRefreshInterval: 30_000,
      redisOptions: sharedNodeOptions,
    });
  }

  return new IORedis({
    host: cfg.host,
    port: cfg.port,
    lazyConnect: true,
    enableReadyCheck: false,
    ...sharedNodeOptions,
  });
}

function formatRedisSetupError(err) {
  if (!err || !err.message) return String(err);
  const last = err.lastNodeError?.message;
  return last ? `${err.message} | lastNode: ${last}` : err.message;
}

function envConnectMs() {
  return process.env.LOAD_TEST_REDIS_CONNECT_MS || String(DEFAULT_REDIS_CONNECT_MS);
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `${label}: timeout após ${ms}ms (ElastiCache costuma ser só na VPC; use LOAD_TEST_SKIP_REDIS_FLUSH=1 se estiver fora da rede)`,
            ),
          ),
        ms,
      );
    }),
  ]);
}

/** Remove só chaves do cache de lojas (hash tag {store}) — compatível com Cluster e sem FLUSHALL global. */
async function scanDeleteStoreCacheKeys(redis) {
  let cursor = '0';
  let deleted = 0;
  do {
    const [next, keys] = await redis.scan(
      cursor,
      'MATCH',
      STORE_CACHE_KEY_PATTERN,
      'COUNT',
      200,
    );
    cursor = next;
    if (keys.length > 0) {
      await redis.del(...keys);
      deleted += keys.length;
    }
  } while (cursor !== '0');
  return deleted;
}

async function purgeRedisCache(env) {
  if (/^(1|true|yes)$/i.test(env.LOAD_TEST_SKIP_REDIS_FLUSH || '')) {
    warn('LOAD_TEST_SKIP_REDIS_FLUSH — pulando flush do Redis.');
    return;
  }

  const redisCfg = resolveRedisEnv(env);
  if (!redisCfg) {
    warn('REDIS_HOST / REDIS_URL não definido — pulando flush do cache.');
    return;
  }

  for (const hint of redisCfg.hints || []) {
    warn(hint);
  }

  const connectMs = parseInt(envConnectMs(), 10);
  const flushMode =
    env.LOAD_TEST_REDIS_FLUSH_MODE ||
    (redisCfg.cluster ? 'scan' : 'flushdb');

  let redis;
  try {
    const IORedis = require('ioredis');
    redis = createRedisForSetup(IORedis, redisCfg);
    redis.on('error', () => {
      /* ioredis emite error assíncrono no slot refresh — evita Unhandled error event */
    });
    log(
      `Redis ${redisCfg.cluster ? 'cluster' : 'standalone'} ` +
        `${redisCfg.host}:${redisCfg.port} tls=${redisCfg.tls} modo=${flushMode}...`,
    );
    if (isElastiCacheClusterEndpoint(redisCfg.host) && !redisCfg.tls) {
      warn(
        'Host clustercfg.* sem TLS — se o ElastiCache tiver encryption in-transit, defina REDIS_TLS=true',
      );
    }

    if (!redisCfg.cluster) {
      await withTimeout(redis.connect(), connectMs, 'Redis connect');
    }
    await withTimeout(redis.ping(), connectMs, 'Redis PING');

    if (flushMode === 'flushall') {
      await withTimeout(redis.flushall(), DEFAULT_REDIS_COMMAND_MS, 'FLUSHALL');
      ok('Redis FLUSHALL concluído.');
    } else if (flushMode === 'flushdb') {
      await withTimeout(redis.flushdb(), DEFAULT_REDIS_COMMAND_MS, 'FLUSHDB');
      ok('Redis FLUSHDB concluído.');
    } else {
      const deleted = await withTimeout(
        scanDeleteStoreCacheKeys(redis),
        60_000,
        'SCAN cache store',
      );
      ok(`Redis: ${deleted} chave(s) "${STORE_CACHE_KEY_PATTERN}" removidas.`);
    }
  } catch (err) {
    warn(`Redis flush falhou (${formatRedisSetupError(err)}) — continuando.`);
    if (String(err.message).includes('timeout')) {
      warn(
        'Checklist: (1) REDIS_CLUSTER=true e REDIS_TLS=true no .env ' +
          '(2) VM e ElastiCache na mesma VPC ' +
          '(3) SG do cache libera porta 6379 do SG da VM ' +
          '(4) ou LOAD_TEST_SKIP_REDIS_FLUSH=1',
      );
    }
  } finally {
    if (redis) await redis.quit().catch(() => {});
  }
}

// ── 3. user_profile ───────────────────────────────────────────────────────────
async function upsertUserProfile(client, userAuthId, email) {
  log(`Verificando user_profile (userAuthId=${userAuthId.slice(0, 8)}...)...`);

  const existing = await client.query(
    'SELECT id FROM user_profiles WHERE user_auth_id = $1 LIMIT 1',
    [userAuthId],
  );
  if (existing.rows.length > 0) {
    ok(`user_profile já existe: ${existing.rows[0].id}`);
    return existing.rows[0].id;
  }

  const inserted = await client.query(`
    INSERT INTO user_profiles (id, user_auth_id, name, email, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, 'Load Test User', $2, NOW(), NOW())
    RETURNING id
  `, [userAuthId, email]);

  ok(`user_profile criado: ${inserted.rows[0].id}`);
  return inserted.rows[0].id;
}

// ── 4. Loja de teste ──────────────────────────────────────────────────────────
async function createTestStore(client) {
  log(`Criando loja de teste (id=${TEST_STORE_ID})...`);
  await client.query(`
    INSERT INTO stores (id, name, description, whatsapp, photo_url, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW())
  `, [TEST_STORE_ID, SEED_STORE_NAME, 'Loja criada pelo setup de load test — não remover.', '11987654321', PLACEHOLDER_PHOTO_URL]);
  ok(`Loja criada: ${TEST_STORE_ID}`);
}

// ── 5. Disponibilidades ───────────────────────────────────────────────────────
async function createStoreAvailabilities(client) {
  log('Criando disponibilidades (todos os dias, 00:00–23:59)...');
  for (let weekday = 0; weekday <= 6; weekday++) {
    await client.query(`
      INSERT INTO store_availabilities (id, weekday, start, "end", store_id, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, '00:00', '23:59', $2, NOW(), NOW())
    `, [weekday, TEST_STORE_ID]);
  }
  ok('7 disponibilidades criadas.');
}

// ── 6. Produtos e opções ──────────────────────────────────────────────────────
async function insertProductWithOption(client, productId, optionId, label, storeId = TEST_STORE_ID) {
  await client.query(`
    INSERT INTO products (id, name, description, value, photo_url, category, store_id, created_at, updated_at)
    VALUES ($1, $2, $3, 1000, $4, 'savory', $5, NOW(), NOW())
  `, [productId, `Prod LT ${label}`, `Produto de load test ${label}.`, PLACEHOLDER_PHOTO_URL, storeId]);

  await client.query(`
    INSERT INTO product_options (id, name, quantity, product_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
  `, [optionId, `Opcao ${label}`, PRODUCT_OPTION_QUANTITY, productId]);
}

async function createOrderTargetProducts(client) {
  log(`Criando ${ORDER_TARGETS_COUNT} produtos para ORDER_TARGETS (c1a, c3a, c3b)...`);
  for (let i = 1; i <= ORDER_TARGETS_COUNT; i++) {
    const { productId, productOptionId } = orderTargetIds(i);
    await insertProductWithOption(client, productId, productOptionId, String(i).padStart(3, '0'));
  }
  ok(`${ORDER_TARGETS_COUNT} produtos ORDER_TARGETS criados.`);
}

// ── 7. Bulk stores com status variado ─────────────────────────────────────────
async function bulkInsertStores(client) {
  const countRes = await client.query(
    'SELECT COUNT(*)::int AS cnt FROM stores WHERE name LIKE $1',
    [`${BULK_STORE_LABEL}%`],
  );
  const current = countRes.rows[0].cnt;
  const needed  = Math.max(0, BULK_STORE_COUNT - current);

  if (needed === 0) {
    const totalRes = await client.query('SELECT COUNT(*)::int AS cnt FROM stores');
    ok(`Lojas bulk já existentes (${current}) — total no banco: ${totalRes.rows[0].cnt}.`);
    return;
  }

  log(`Inserindo ${needed} lojas bulk (atual: ${current}, meta: ${BULK_STORE_COUNT})...`);
  log(`  Distribuição: ~87% abertas (status=TRUE), ~13% fechadas (status=FALSE)`);

  const startIndex = current + 1;
  let inserted = 0;

  while (inserted < needed) {
    const batchSize = Math.min(BULK_BATCH_SIZE, needed - inserted);
    const rows   = [];
    const params = [];

    // 4 parâmetros por linha: name, description, whatsapp, photo_url
    // status é literal SQL para evitar ambiguidade de tipo com booleanos
    for (let i = 0; i < batchSize; i++) {
      const n          = startIndex + inserted + i;
      const base       = i * 4;
      const statusLit  = (n % 8 === 0) ? 'FALSE' : 'TRUE'; // ~13% fechadas
      rows.push(`(gen_random_uuid(), $${base+1}, $${base+2}, $${base+3}, $${base+4}, ${statusLit}, NOW(), NOW())`);
      params.push(
        `${BULK_STORE_LABEL} ${String(n).padStart(6, '0')}`,
        'Loja gerada pelo setup de load test para teste de listagem.',
        '11987654321',
        PLACEHOLDER_PHOTO_URL,
      );
    }

    await client.query(
      `INSERT INTO stores (id, name, description, whatsapp, photo_url, status, created_at, updated_at) VALUES ${rows.join(', ')}`,
      params,
    );

    inserted += batchSize;
    log(`  ${inserted}/${needed} lojas bulk inseridas`);
  }

  ok(`Bulk insert concluído: ${needed} lojas adicionadas.`);
}

// ── 8. ANALYZE — atualiza estatísticas do otimizador ─────────────────────────
async function analyzeDatabase(client) {
  log('Executando ANALYZE (atualiza estatísticas do otimizador de consultas)...');
  await client.query(
    'ANALYZE stores, products, product_options, order_requests, order_request_items',
  );
  ok('ANALYZE concluído — PostgreSQL usará planos de execução otimizados.');
}

// ── 9. Gravar .env.k6 ────────────────────────────────────────────────────────
function buildEnvK6() {
  const orderTargets = Array.from({ length: ORDER_TARGETS_COUNT }, (_, i) => {
    const { productId, productOptionId } = orderTargetIds(i + 1);
    return { storeId: TEST_STORE_ID, productId, productOptionId };
  });

  const lines = [
    `# Gerado automaticamente por load-tests/setup.js em ${new Date().toISOString()}`,
    `# Não edite manualmente — execute "node load-tests/setup.js" para regenerar.`,
    ``,
    `# ── Configuração geral ──────────────────────────────────────────────────────`,
    `K6_BASE_URL=${BASE_URL}`,
    `K6_AUTH_TOKEN=${TOKEN}`,
    ``,
    `# ── Cenário 1A / Cenário 3 — ORDER_TARGETS (${orderTargets.length} entradas) ──`,
    `K6_ORDER_TARGETS='${JSON.stringify(orderTargets)}'`,
    ``,
    `# ── Cenário 1B — target único para alta contenção ──────────────────────────`,
    `K6_CONTENTION_TARGET='${JSON.stringify(orderTargets[0])}'`,
    ``,
    `# ── Cenário 3 — nível de contenção (sync vs async) ─────────────────────────`,
    `K6_CONTENTION=low`,
    ``,
  ];

  fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');
  ok(`.env.k6 gravado em: ${OUT_FILE}`);

  return { orderTargets };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function printSetupBanner(mode) {
  console.log('');
  console.log(`${B}══════════════════════════════════════════════════════${X}`);
  console.log(`${B} Setup de Load Tests — iffood-api (${mode})${X}`);
  console.log(`${B}══════════════════════════════════════════════════════${X}`);
  console.log(`  API: ${BASE_URL}`);
  console.log('');
}

function assertCredentials() {
  if (!TOKEN) fail('K6_AUTH_TOKEN não definido no .env ou no shell.');
  if (!DB_URL) fail('DB_URL não definido no .env ou no shell.');
  return decodeJwt(TOKEN);
}

/**
 * Reset leve antes de c1/c3 isolados (run-one.sh):
 * purge SQS + Redis, limpa só a loja de pedidos, repõe ORDER_TARGETS com estoque 500.
 * Não recria 10k lojas bulk.
 */
async function runQuickReset() {
  printSetupBanner('reset rápido — c1 / c3');
  const payload = assertCredentials();
  const userAuthId = payload.sub;
  const email = payload.email || 'loadtest@example.com';

  await purgeQueues();

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    await configureSetupSession(client);
    await cleanStoreData(client, TEST_STORE_ID, 'principal (c1/c2/c3)');
    await upsertUserProfile(client, userAuthId, email);
    await createTestStore(client);
    await createStoreAvailabilities(client);
    await createOrderTargetProducts(client);
  } finally {
    await client.end();
  }

  const { orderTargets } = buildEnvK6();
  console.log('');
  ok(`Reset rápido concluído — ${orderTargets.length} ORDER_TARGETS com estoque ${PRODUCT_OPTION_QUANTITY}.`);
  console.log(`  ${C}Próximo passo:${X} ./load-tests/run-one.sh c3a`);
  console.log('');
}

async function runFullSetup() {
  printSetupBanner('completo');
  const payload = assertCredentials();
  const userAuthId = payload.sub;
  const email = payload.email || 'loadtest@example.com';

  await purgeQueues();

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    await cleanAll(client);
    await upsertUserProfile(client, userAuthId, email);
    await createTestStore(client);
    await createStoreAvailabilities(client);
    await createOrderTargetProducts(client);
    await bulkInsertStores(client);
    await analyzeDatabase(client);
  } finally {
    await client.end();
  }

  const { orderTargets } = buildEnvK6();

  console.log('');
  console.log(`${B}══════════════════════════════════════════════════════${X}`);
  console.log(`${G}${B} Setup concluído — banco em estado reproduzível!${X}`);
  console.log(`${B}══════════════════════════════════════════════════════${X}`);
  console.log(`  Loja de teste (c1/c2/c3) : ${TEST_STORE_ID}`);
  console.log(`  ORDER_TARGETS            : ${orderTargets.length} produtos`);
  console.log(`  Lojas bulk               : ${BULK_STORE_COUNT.toLocaleString()}`);
  console.log(`  .env.k6              : ${OUT_FILE}`);
  console.log('');
  console.log(`  ${C}Próximo passo:${X} ./load-tests/run-one.sh c3a`);
  console.log(`  ${C}Bateria completa:${X} ./load-tests/run-all.sh`);
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--reset-quick')) {
    await runQuickReset();
    return;
  }
  await runFullSetup();
}

main().catch((err) => {
  console.error(`\n${R}[setup] Erro fatal:${X}`, err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
