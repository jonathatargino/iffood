import 'dotenv/config';
import { DataSource } from 'typeorm';
import { v4 as uuid } from 'uuid';

/**
 * Seed script — populates the database with sample data.
 *
 * Run with:
 *   npx ts-node src/database/seeds/seed.ts
 */

const dataSource = new DataSource({
  type: (process.env.DB_TYPE as 'postgres' | 'mysql') ?? 'postgres',
  url: process.env.DB_URL,
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

// ─── Helper ──────────────────────────────────────────────────────────
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Data ────────────────────────────────────────────────────────────

const STORE_NAMES = [
  'Sabor do Campus',
  'Delícias da IF',
  'Cantinho Gourmet',
  'Doce Tentação',
  'Salgados & Cia',
];

const STORE_DESCRIPTIONS = [
  'Os melhores lanches do campus, feitos com carinho e ingredientes frescos!',
  'Comida caseira com tempero de mãe. Peça já e mate sua fome!',
  'Opções doces e salgadas para todos os gostos. Delivery rápido!',
  'Doces artesanais e sobremesas irresistíveis para adoçar seu dia.',
  'Salgados assados e fritos quentinhos saindo do forno toda hora!',
];

const PRODUCT_DATA: {
  name: string;
  description: string;
  value: number;
  category: 'sweet' | 'savory';
  options: { name: string; quantity: number }[];
}[] = [
  {
    name: 'Coxinha de Frango',
    description: 'Coxinha crocante recheada com frango desfiado temperado',
    value: 600,
    category: 'savory',
    options: [
      { name: 'Tradicional', quantity: 30 },
      { name: 'Com Catupiry', quantity: 20 },
    ],
  },
  {
    name: 'Empada de Palmito',
    description: 'Empada caseira com recheio cremoso de palmito',
    value: 500,
    category: 'savory',
    options: [{ name: 'Porção Individual', quantity: 25 }],
  },
  {
    name: 'Brownie de Chocolate',
    description: 'Brownie intenso de chocolate meio amargo com nozes',
    value: 800,
    category: 'sweet',
    options: [
      { name: 'Simples', quantity: 15 },
      { name: 'Com Sorvete', quantity: 10 },
    ],
  },
  {
    name: 'Açaí na Tigela',
    description: 'Açaí cremoso com granola, banana e leite condensado',
    value: 1500,
    category: 'sweet',
    options: [
      { name: '300ml', quantity: 20 },
      { name: '500ml', quantity: 15 },
    ],
  },
  {
    name: 'Pastel de Carne',
    description: 'Pastel frito na hora com carne moída bem temperada',
    value: 700,
    category: 'savory',
    options: [
      { name: 'Pequeno', quantity: 40 },
      { name: 'Grande', quantity: 25 },
    ],
  },
  {
    name: 'Bolo de Cenoura',
    description: 'Bolo de cenoura fofinho com cobertura de chocolate',
    value: 600,
    category: 'sweet',
    options: [{ name: 'Fatia', quantity: 20 }],
  },
  {
    name: 'Esfirra de Carne',
    description: 'Esfirra aberta com recheio generoso de carne temperada',
    value: 550,
    category: 'savory',
    options: [
      { name: 'Aberta', quantity: 30 },
      { name: 'Fechada', quantity: 25 },
    ],
  },
  {
    name: 'Brigadeiro Gourmet',
    description: 'Brigadeiro gourmet feito com chocolate belga premium',
    value: 400,
    category: 'sweet',
    options: [
      { name: 'Ao Leite', quantity: 50 },
      { name: 'Meio Amargo', quantity: 40 },
      { name: 'Branco', quantity: 35 },
    ],
  },
];

const REVIEW_TAGS = [
  'Rápido',
  'Saboroso',
  'Boa porção',
  'Atendimento top',
  'Preço justo',
  'Demorou',
  'Frio',
  'Pouca quantidade',
];

const REVIEW_DESCRIPTIONS = [
  'Muito bom! Recomendo demais, sempre peço.',
  'Chegou rápido e quentinho. Adorei!',
  'Sabor excelente, mas a porção poderia ser maior.',
  'Bom custo-benefício. Voltarei a pedir com certeza.',
  'Atendimento nota 10, super atenciosos!',
  'Demorou um pouco mais que o esperado, mas valeu a pena.',
  'Comida estava fria quando chegou, mas o sabor era bom.',
  'Perfeito como sempre. Melhor loja do campus!',
  null,
  null,
  null,
];

const PHOTO_URL =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop';

// ─── Seed Logic ──────────────────────────────────────────────────────

async function seed() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  console.log('🌱 Starting seed...\n');

  try {
    await queryRunner.startTransaction();

    // 1. Create user profiles
    const userIds: string[] = [];
    for (let i = 0; i < 8; i++) {
      const id = uuid();
      userIds.push(id);
      await queryRunner.query(
        `INSERT INTO user_profiles (id, user_auth_id, name, email, whatsapp, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [
          id,
          uuid(),
          `Usuário Teste ${i + 1}`,
          `user${i + 1}@test.com`,
          `849${String(10000000 + i).slice(0, 8)}`,
        ],
      );
    }
    console.log(`✅ Created ${userIds.length} user profiles`);

    // 2. Create stores
    const storeIds: string[] = [];
    for (let i = 0; i < STORE_NAMES.length; i++) {
      const storeId = uuid();
      storeIds.push(storeId);
      const ownerId = userIds[i % userIds.length];

      await queryRunner.query(
        `INSERT INTO stores (id, name, description, whatsapp, photo_url, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
        [
          storeId,
          STORE_NAMES[i],
          STORE_DESCRIPTIONS[i],
          `849${String(20000000 + i).slice(0, 8)}`,
          PHOTO_URL,
        ],
      );

      // Store user (owner)
      await queryRunner.query(
        `INSERT INTO store_users (id, store_id, user_profile_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [uuid(), storeId, ownerId],
      );

      // Availability: Monday to Saturday 08:00-22:00, Sunday 10:00-18:00
      for (let weekday = 0; weekday <= 6; weekday++) {
        const start = '06:00';
        const end = '22:00';
        await queryRunner.query(
          `INSERT INTO store_availabilities (id, store_id, weekday, "start", "end", created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [uuid(), storeId, weekday, start, end],
        );
      }
    }
    console.log(`✅ Created ${storeIds.length} stores with availabilities`);

    // 3. Create products & product options
    interface ProductRecord {
      productId: string;
      storeId: string;
      name: string;
      value: number;
      options: { optionId: string; name: string }[];
    }
    const allProducts: ProductRecord[] = [];

    for (const storeId of storeIds) {
      // Each store gets 3-5 random products
      const numProducts = randomInt(3, 5);
      const shuffled = [...PRODUCT_DATA].sort(() => Math.random() - 0.5);

      for (let p = 0; p < numProducts; p++) {
        const prod = shuffled[p];
        const productId = uuid();

        await queryRunner.query(
          `INSERT INTO products (id, store_id, name, description, photo_url, value, category, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            productId,
            storeId,
            prod.name,
            prod.description,
            PHOTO_URL,
            prod.value,
            prod.category,
          ],
        );

        const options: { optionId: string; name: string }[] = [];
        for (const opt of prod.options) {
          const optionId = uuid();
          options.push({ optionId, name: opt.name });
          await queryRunner.query(
            `INSERT INTO product_options (id, product_id, name, quantity, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [optionId, productId, opt.name, opt.quantity],
          );
        }

        allProducts.push({
          productId,
          storeId,
          name: prod.name,
          value: prod.value,
          options,
        });
      }
    }
    console.log(`✅ Created ${allProducts.length} products with options`);

    // 4. Create order requests (mix of PENDING and CONCLUDED)
    const orderIds: {
      id: string;
      storeId: string;
      buyerId: string;
      status: string;
    }[] = [];

    for (const storeId of storeIds) {
      const storeProducts = allProducts.filter((p) => p.storeId === storeId);
      // 8-12 orders per store to ensure enough for reviews
      const numOrders = randomInt(8, 12);

      for (let o = 0; o < numOrders; o++) {
        const orderId = uuid();
        const buyerId = pick(userIds);
        const isConcluded = o < numOrders - 2; // Leave last 2 as PENDING
        const status = isConcluded ? 'CONCLUDED' : 'PENDING';

        await queryRunner.query(
          `INSERT INTO order_requests (id, cart_id, status, buyer_user_id, store_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW() - interval '${randomInt(1, 30)} days', NOW())`,
          [orderId, uuid(), status, buyerId, storeId],
        );

        // 1-3 items per order
        const numItems = randomInt(1, 3);
        for (let i = 0; i < numItems; i++) {
          const prod = pick(storeProducts);
          const opt = pick(prod.options);
          await queryRunner.query(
            `INSERT INTO order_request_items (id, order_request_id, product_id, product_option_id, quantity, product_name, product_option_name, product_value, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
            [
              uuid(),
              orderId,
              prod.productId,
              opt.optionId,
              randomInt(1, 3),
              prod.name,
              opt.name,
              prod.value,
            ],
          );
        }

        orderIds.push({ id: orderId, storeId, buyerId, status });
      }
    }
    console.log(`✅ Created ${orderIds.length} order requests with items`);

    // 5. Create review requests and reviews for CONCLUDED orders
    let reviewRequestCount = 0;
    let reviewCount = 0;

    const concludedOrders = orderIds.filter((o) => o.status === 'CONCLUDED');

    for (const order of concludedOrders) {
      const reviewRequestId = uuid();

      // ~80% of concluded orders get a review (accepted), rest stay pending
      const willReview = Math.random() < 0.8;
      const rrStatus = willReview ? 'ACCEPTED' : 'PENDING';

      await queryRunner.query(
        `INSERT INTO review_requests (id, order_request_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, NOW() - interval '${randomInt(0, 10)} days', NOW())`,
        [reviewRequestId, order.id, rrStatus],
      );
      reviewRequestCount++;

      if (willReview) {
        const rating = randomInt(3, 5); // Mostly positive reviews
        const numTags = randomInt(0, 3);
        const tags: string[] = [];
        for (let t = 0; t < numTags; t++) {
          const tag = pick(REVIEW_TAGS);
          if (!tags.includes(tag)) tags.push(tag);
        }
        const description = pick(REVIEW_DESCRIPTIONS);

        await queryRunner.query(
          `INSERT INTO reviews (id, review_request_id, rating, tags, description, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW() - interval '${randomInt(0, 5)} days', NOW())`,
          [uuid(), reviewRequestId, rating, JSON.stringify(tags), description],
        );
        reviewCount++;
      }
    }
    console.log(`✅ Created ${reviewRequestCount} review requests`);
    console.log(`✅ Created ${reviewCount} reviews`);

    await queryRunner.commitTransaction();
    console.log('\n🎉 Seed completed successfully!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Seed failed, transaction rolled back:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

void seed();
