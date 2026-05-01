#!/usr/bin/env node
'use strict';

/**
 * load-tests/setup.js
 *
 * Coloca o banco em estado determinístico e gera iffood-api/.env.k6 com os IDs
 * fixos e token necessários para os 8 testes k6 rodarem com total reprodutibilidade.
 *
 * PRINCÍPIOS DE DESIGN:
 *   - UUIDs fixos → .env.k6 idêntico em toda execução
 *   - Limpeza total antes da repopulação → estado inicial sempre igual
 *   - SQL direto → sem dependência de S3, sem latência de upload
 *   - Estoque resetado a 500/execução → testes não esgotam stock entre rodadas
 *   - Dados históricos em order_requests → exercita JOINs do Cenário 3 com volume real
 *   - ANALYZE após bulk inserts → otimizador PostgreSQL usa planos corretos
 *   - Purge de SQS e Redis → isolamento total do Cenário 4
 *
 * Uso:
 *   node load-tests/setup.js
 *
 * Variáveis de ambiente (lidas do .env da raiz ou do shell):
 *
 *   Obrigatórias:
 *     K6_AUTH_TOKEN   — "Bearer eyJ..." do usuário de teste
 *     DB_URL          — connection string PostgreSQL
 *
 *   Opcionais:
 *     K6_BASE_URL                   — URL da API       (padrão: http://localhost:3006)
 *     LOAD_TEST_ORDER_TARGETS_COUNT — produtos c1/c4   (padrão: 150)
 *     LOAD_TEST_STORE_COUNT         — lojas bulk c2    (padrão: 10000)
 *     LOAD_TEST_HISTORICAL_ORDERS   — orders históricos c3 (padrão: 50000)
 *     REDIS_URL                     — para flush do cache
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
const BASE_URL = process.env.K6_BASE_URL   || 'http://localhost:3006';
const DB_URL   = process.env.DB_URL        || '';
const TOKEN    = process.env.K6_AUTH_TOKEN || '';

const ORDER_TARGETS_COUNT   = parseInt(process.env.LOAD_TEST_ORDER_TARGETS_COUNT  || '150',   10);
const PRODUCT_IDS_COUNT     = 8;
const BULK_STORE_COUNT      = parseInt(process.env.LOAD_TEST_STORE_COUNT          || '10000', 10);
const HISTORICAL_ORDER_COUNT = parseInt(process.env.LOAD_TEST_HISTORICAL_ORDERS   || '50000', 10);
const BULK_BATCH_SIZE       = 500;

const PRODUCT_OPTION_QUANTITY = 500; // máximo do CHECK constraint
const PLACEHOLDER_PHOTO_URL   = 'https://example.com/load-test-placeholder.png';
const OUT_FILE                = path.join(__dirname, '..', '.env.k6'); // raiz (onde run-all.sh espera)

// ── UUIDs fixos — .env.k6 idêntico em toda execução ──────────────────────────
const TEST_STORE_ID = '10000000-0000-4000-8000-000000000001';

// Loja dedicada ao Cenário 3 (produtos PRODUCT_IDS + 50k pedidos históricos).
// ISOLADA do TEST_STORE_ID para que a query GET /store do c2 não percorra os
// 50k order_requests no seu GROUP BY, evitando statement timeout no setup().
const HISTORICAL_STORE_ID = '10000000-0000-4000-8000-000000000002';

function orderTargetIds(i) {
  const hex = i.toString(16).padStart(4, '0');
  return {
    productId:       `20000000-${hex}-4000-8000-000000000001`,
    productOptionId: `30000000-${hex}-4000-8000-000000000001`,
  };
}

function productIdsIds(i) {
  const hex = i.toString(16).padStart(4, '0');
  return {
    productId:       `40000000-${hex}-4000-8000-000000000001`,
    productOptionId: `50000000-${hex}-4000-8000-000000000001`,
  };
}

const SEED_STORE_NAME  = '__load-test__';
const HIST_STORE_NAME  = '__load-test-hist__';
const BULK_STORE_LABEL = '__bulk__';

// Distribuição de status dos pedidos históricos (realismo)
const ORDER_STATUSES = [
  'CONCLUDED', 'CONCLUDED', 'CONCLUDED', 'CONCLUDED',
  'PENDING',
  'REJECTED',
  'CHANGED_AND_CONCLUDED',
];

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
async function cleanStoreData(client, storeId) {
  // Limpa na ordem correta das FKs: reviews → review_requests → items → orders
  // → store_users → availabilities → product_options → products → store
  await client.query(`
    DELETE FROM reviews
    WHERE review_request_id IN (
      SELECT rr.id FROM review_requests rr
      JOIN order_requests orq ON orq.id = rr.order_request_id
      WHERE orq.store_id = $1
    )
  `, [storeId]);

  await client.query(`
    DELETE FROM review_requests
    WHERE order_request_id IN (SELECT id FROM order_requests WHERE store_id = $1)
  `, [storeId]);

  await client.query(`
    DELETE FROM order_request_items
    WHERE order_request_id IN (SELECT id FROM order_requests WHERE store_id = $1)
  `, [storeId]);

  await client.query('DELETE FROM order_requests        WHERE store_id = $1', [storeId]);
  await client.query('DELETE FROM store_users            WHERE store_id = $1', [storeId]);
  await client.query('DELETE FROM store_availabilities  WHERE store_id = $1', [storeId]);

  await client.query(`
    DELETE FROM product_options
    WHERE product_id IN (SELECT id FROM products WHERE store_id = $1)
  `, [storeId]);

  await client.query('DELETE FROM products WHERE store_id = $1', [storeId]);
  await client.query('DELETE FROM stores    WHERE id = $1', [storeId]);
}

async function cleanAll(client) {
  log('Limpando dados de teste anteriores...');

  // Loja principal (c1/c4) e loja histórica (c3) — ambas com FKs
  await cleanStoreData(client, TEST_STORE_ID);
  await cleanStoreData(client, HISTORICAL_STORE_ID);

  // Lojas bulk (c2) — sem pedidos/produtos, deleção direta
  await client.query('DELETE FROM stores WHERE name LIKE $1', [`${BULK_STORE_LABEL}%`]);

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
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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

  // Redis
  const redisUrl = process.env.REDIS_URL || '';
  if (redisUrl) {
    let redis;
    try {
      const IORedis = require('ioredis');
      redis = new IORedis(redisUrl, { lazyConnect: true, enableReadyCheck: false });
      log('Flushing cache Redis...');
      await redis.connect();
      await redis.flushdb();
      ok('Redis FLUSHDB concluído.');
    } catch (err) {
      warn(`Redis flush falhou (${err.message}) — continuando.`);
    } finally {
      if (redis) await redis.quit().catch(() => {});
    }
  } else {
    warn('REDIS_URL não definido — pulando flush do cache.');
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

// ── 5b. Loja histórica (isolada para c3) ──────────────────────────────────────
async function createHistoricalStore(client) {
  log(`Criando loja histórica (id=${HISTORICAL_STORE_ID}) para c3a/c3b...`);
  await client.query(`
    INSERT INTO stores (id, name, description, whatsapp, photo_url, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW())
  `, [
    HISTORICAL_STORE_ID,
    HIST_STORE_NAME,
    'Loja histórica — contém 50k pedidos para exercitar JOINs do Cenário 3.',
    '11987654321',
    PLACEHOLDER_PHOTO_URL,
  ]);

  // Disponibilidades (obrigatório para a loja aparecer no GET /store como ativa)
  for (let weekday = 0; weekday <= 6; weekday++) {
    await client.query(`
      INSERT INTO store_availabilities (id, weekday, start, "end", store_id, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, '00:00', '23:59', $2, NOW(), NOW())
    `, [weekday, HISTORICAL_STORE_ID]);
  }
  ok(`Loja histórica criada: ${HISTORICAL_STORE_ID}`);
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
  log(`Criando ${ORDER_TARGETS_COUNT} produtos para ORDER_TARGETS (c1a, c4a, c4b)...`);
  for (let i = 1; i <= ORDER_TARGETS_COUNT; i++) {
    const { productId, productOptionId } = orderTargetIds(i);
    await insertProductWithOption(client, productId, productOptionId, String(i).padStart(3, '0'));
  }
  ok(`${ORDER_TARGETS_COUNT} produtos ORDER_TARGETS criados.`);
}

async function createProductIdProducts(client) {
  log(`Criando ${PRODUCT_IDS_COUNT} produtos para PRODUCT_IDS (c3a, c3b) na loja histórica...`);
  for (let i = 1; i <= PRODUCT_IDS_COUNT; i++) {
    const { productId, productOptionId } = productIdsIds(i);
    // Produtos do c3 vão para HISTORICAL_STORE_ID — isolados do TEST_STORE_ID
    // para que o GET /store do c2 não precise percorrer os 50k pedidos históricos
    await insertProductWithOption(client, productId, productOptionId, `C3-${String(i).padStart(2, '0')}`, HISTORICAL_STORE_ID);
  }
  ok(`${PRODUCT_IDS_COUNT} produtos PRODUCT_IDS criados em HISTORICAL_STORE_ID.`);
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

// ── 8. Dados históricos para c3a/c3b (volume real de orders) ─────────────────
async function createHistoricalOrders(client, userProfileId) {
  log(`Criando ${HISTORICAL_ORDER_COUNT.toLocaleString()} pedidos históricos para c3a/c3b...`);
  log('  (Simula crescimento real do banco — exercita JOINs cruzados do Cenário 3)');

  // Espalha datas de criação ao longo do último ano (simula "tempo de vida")
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const msPerOrder  = ONE_YEAR_MS / HISTORICAL_ORDER_COUNT;

  let inserted = 0;

  while (inserted < HISTORICAL_ORDER_COUNT) {
    const batchSize = Math.min(BULK_BATCH_SIZE, HISTORICAL_ORDER_COUNT - inserted);

    // ── INSERT orders ───────────────────────────────────────────────────────
    // 5 params por linha: status, cart_id, buyer_user_id, store_id, created_at
    const orderRows   = [];
    const orderParams = [];

    for (let i = 0; i < batchSize; i++) {
      const globalIdx = inserted + i;
      const base      = i * 5;
      const status    = ORDER_STATUSES[globalIdx % ORDER_STATUSES.length];
      const cartId    = `hist-${globalIdx + 1}`;
      const createdAt = new Date(Date.now() - (HISTORICAL_ORDER_COUNT - globalIdx) * msPerOrder);

      orderRows.push(
        `(gen_random_uuid(), $${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+5}, NULL)`,
      );
      // Pedidos vinculados à HISTORICAL_STORE_ID — NÃO ao TEST_STORE_ID.
      // Isso isola os 50k pedidos do c3 da query GROUP BY do GET /store,
      // impedindo o statement timeout no setup() do c2a/c2b.
      orderParams.push(status, cartId, userProfileId, HISTORICAL_STORE_ID, createdAt.toISOString());
    }

    const orderResult = await client.query(
      `INSERT INTO order_requests (id, status, cart_id, buyer_user_id, store_id, created_at, updated_at, expires_at)
       VALUES ${orderRows.join(', ')} RETURNING id`,
      orderParams,
    );

    const orderIds = orderResult.rows.map((r) => r.id);

    // ── INSERT items para cada order ────────────────────────────────────────
    // 7 params por linha: quantity, product_name, product_option_name, product_value,
    //                     order_request_id, product_id, product_option_id
    const itemRows   = [];
    const itemParams = [];

    for (let i = 0; i < batchSize; i++) {
      const globalIdx                    = inserted + i;
      const base                         = i * 7;
      const productSlot                  = (globalIdx % PRODUCT_IDS_COUNT) + 1;
      const { productId, productOptionId } = productIdsIds(productSlot);
      const label                        = `C3-${String(productSlot).padStart(2, '0')}`;

      itemRows.push(
        `(gen_random_uuid(), $${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+6}, $${base+7}, NOW(), NOW())`,
      );
      itemParams.push(
        1,                    // quantity
        `Prod LT ${label}`,   // product_name
        `Opcao ${label}`,     // product_option_name
        1000,                 // product_value
        orderIds[i],          // order_request_id
        productId,            // product_id
        productOptionId,      // product_option_id
      );
    }

    await client.query(
      `INSERT INTO order_request_items
         (id, quantity, product_name, product_option_name, product_value,
          order_request_id, product_id, product_option_id, created_at, updated_at)
       VALUES ${itemRows.join(', ')}`,
      itemParams,
    );

    inserted += batchSize;
    if (inserted % 5000 === 0 || inserted === HISTORICAL_ORDER_COUNT) {
      log(`  ${inserted.toLocaleString()}/${HISTORICAL_ORDER_COUNT.toLocaleString()} pedidos históricos inseridos`);
    }
  }

  ok(`${HISTORICAL_ORDER_COUNT.toLocaleString()} pedidos históricos criados (espalhados no último ano).`);
}

// ── 9. ANALYZE — atualiza estatísticas do otimizador ─────────────────────────
async function analyzeDatabase(client) {
  log('Executando ANALYZE (atualiza estatísticas do otimizador de consultas)...');
  await client.query(
    'ANALYZE stores, products, product_options, order_requests, order_request_items',
  );
  ok('ANALYZE concluído — PostgreSQL usará planos de execução otimizados.');
}

// ── 10. Gravar .env.k6 ────────────────────────────────────────────────────────
function buildEnvK6() {
  const orderTargets = Array.from({ length: ORDER_TARGETS_COUNT }, (_, i) => {
    const { productId, productOptionId } = orderTargetIds(i + 1);
    return { storeId: TEST_STORE_ID, productId, productOptionId };
  });

  const productIds = Array.from({ length: PRODUCT_IDS_COUNT }, (_, i) =>
    productIdsIds(i + 1).productId,
  );

  const lines = [
    `# Gerado automaticamente por load-tests/setup.js em ${new Date().toISOString()}`,
    `# Não edite manualmente — execute "node load-tests/setup.js" para regenerar.`,
    ``,
    `# ── Configuração geral ──────────────────────────────────────────────────────`,
    `K6_BASE_URL=${BASE_URL}`,
    `K6_AUTH_TOKEN=${TOKEN}`,
    ``,
    `# ── Cenário 1A / 4A / 4B — ORDER_TARGETS (${orderTargets.length} entradas) ──`,
    `K6_ORDER_TARGETS='${JSON.stringify(orderTargets)}'`,
    ``,
    `# ── Cenário 1B — target único para alta contenção ──────────────────────────`,
    `K6_CONTENTION_TARGET='${JSON.stringify(orderTargets[0])}'`,
    ``,
    `# ── Cenário 3A / 3B — IDs de produtos fixos (${productIds.length} IDs) ─────`,
    `K6_PRODUCT_IDS='${JSON.stringify(productIds)}'`,
    ``,
    `# ── Cenário 4 — nível de contenção ─────────────────────────────────────────`,
    `K6_CONTENTION=low`,
    ``,
  ];

  fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');
  ok(`.env.k6 gravado em: ${OUT_FILE}`);

  return { orderTargets, productIds };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log(`${B}══════════════════════════════════════════════════════${X}`);
  console.log(`${B} Setup de Load Tests — iffood-api${X}`);
  console.log(`${B}══════════════════════════════════════════════════════${X}`);
  console.log(`  API: ${BASE_URL}`);
  console.log('');

  if (!TOKEN)  fail('K6_AUTH_TOKEN não definido no .env ou no shell.');
  if (!DB_URL) fail('DB_URL não definido no .env ou no shell.');

  const payload    = decodeJwt(TOKEN);
  const userAuthId = payload.sub;
  const email      = payload.email || 'loadtest@example.com';

  // 1. Purge de mensageria ANTES de limpar o banco (operações independentes)
  await purgeQueues();

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    // 2. Limpar todos os dados de teste anteriores
    await cleanAll(client);

    // 3. Garantir user_profile
    const userProfileId = await upsertUserProfile(client, userAuthId, email);

    // 4. Loja de teste (c1/c2/c4) — sem pedidos históricos
    await createTestStore(client);

    // 5. Disponibilidades da loja de teste
    await createStoreAvailabilities(client);

    // 5b. Loja histórica isolada (c3) — receberá produtos PRODUCT_IDS e 50k pedidos
    await createHistoricalStore(client);

    // 6. Produtos ORDER_TARGETS → TEST_STORE_ID (c1a, c4a, c4b)
    await createOrderTargetProducts(client);

    // 7. Produtos PRODUCT_IDS → HISTORICAL_STORE_ID (c3a, c3b)
    await createProductIdProducts(client);

    // 8. Bulk stores com status variado (c2a, c2b)
    await bulkInsertStores(client);

    // 9. Pedidos históricos (c3a, c3b — volume real para JOINs)
    await createHistoricalOrders(client, userProfileId);

    // 10. ANALYZE — garante planos de execução corretos
    await analyzeDatabase(client);
  } finally {
    await client.end();
  }

  // 11. Gravar .env.k6
  const { orderTargets, productIds } = buildEnvK6();

  console.log('');
  console.log(`${B}══════════════════════════════════════════════════════${X}`);
  console.log(`${G}${B} Setup concluído — banco em estado reproduzível!${X}`);
  console.log(`${B}══════════════════════════════════════════════════════${X}`);
  console.log(`  Loja de teste (c1/c2/c4) : ${TEST_STORE_ID}  ← SEM pedidos históricos`);
  console.log(`  Loja histórica (c3)      : ${HISTORICAL_STORE_ID}  ← 50k pedidos`);
  console.log(`  ORDER_TARGETS        : ${orderTargets.length} produtos (UUIDs fixos)`);
  console.log(`  CONTENTION_TARGET    : ${orderTargets[0].productOptionId.slice(0, 8)}...`);
  console.log(`  PRODUCT_IDS          : ${productIds.length} IDs fixos para c3a/c3b`);
  console.log(`  Pedidos históricos   : ${HISTORICAL_ORDER_COUNT.toLocaleString()} (loja histórica, último ano)`);
  console.log(`  Lojas bulk           : ${BULK_STORE_COUNT.toLocaleString()} (~87% abertas)`);
  console.log(`  Estoque por opção    : ${PRODUCT_OPTION_QUANTITY} unidades (resetado)`);
  console.log(`  .env.k6              : ${OUT_FILE}`);
  console.log('');
  console.log(`  ${C}Próximo passo:${X} bash load-tests/run-all.sh`);
  console.log('');
}

main().catch((err) => {
  console.error(`\n${R}[setup] Erro fatal:${X}`, err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
