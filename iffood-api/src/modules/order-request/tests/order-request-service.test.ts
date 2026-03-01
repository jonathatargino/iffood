import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { OrderRequestService } from '../order-request.service';
import { OrderRequestRepository } from '../order-request.repository';
import { OrderRequest, OrderRequestStatus } from '../order-request.entity';
import { OrderRequestItem } from '../order-request-item/order-request-item.entity';
import { Product, ProductCategory } from '../../product/product.entity';
import { ProductOption } from '../../product/product-option/product-option.entity';
import { Store } from '../../store/store.entity';
import { StoreUser } from '../../store/store-user/store-user.entity';
import { givenUserProfile } from '../../store/tests/helpers/given-user-profile';
import { OutOfStockError } from '../domain/errors/out-of-stock.error';
import { ForbiddenException } from '@nestjs/common';
import { InvalidOrderStatusTransitionError } from '../domain/errors/invalid-order-status-transition.error';
import { ServiceCreateOrderDto } from '../dto/order-request.service.dto';

jest.setTimeout(60_000);

describe('OrderRequest Service', () => {
  let service: OrderRequestService;
  let dataSource: DataSource;
  let container: StartedTestContainer;
  let moduleRef: TestingModule;

  const TEST_DB_ENV = {
    POSTGRES_USER: 'test',
    POSTGRES_PASSWORD: 'test',
    POSTGRES_DB: 'test_db',
  };
  const EXPOSED_PORT = 5432;

  beforeAll(async () => {
    container = await new GenericContainer('postgres')
      .withExposedPorts(EXPOSED_PORT)
      .withEnvironment(TEST_DB_ENV)
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(EXPOSED_PORT);

    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host,
          port,
          username: TEST_DB_ENV.POSTGRES_USER,
          password: TEST_DB_ENV.POSTGRES_PASSWORD,
          database: TEST_DB_ENV.POSTGRES_DB,
          entities: [join(process.cwd(), 'src/**/*.entity{.ts,.js}')],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([OrderRequest]),
      ],
      providers: [OrderRequestService, OrderRequestRepository],
    }).compile();

    service = moduleRef.get(OrderRequestService);
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE order_request_items, order_requests, product_options, products, store_users, stores, user_profiles CASCADE;`,
    );
  });

  async function createStoreWithProduct(userProfile: any) {
    const store = Store.create({
      name: 'Test Store',
      description: 'A test store',
      whatsapp: '85985454176',
      photoUrl: 'http://image.url/photo.jpg',
      storeUsers: [{ userProfile } as StoreUser],
      products: [
        Product.create({
          name: 'Test Product',
          description: 'A test product description',
          photoUrl: 'http://image.url/product.jpg',
          value: 1000,
          category: ProductCategory.Savory,
          productOptions: [
            ProductOption.create({ name: 'Option A', quantity: 10 }),
            ProductOption.create({ name: 'Option B', quantity: 5 }),
          ],
        }),
      ],
    });
    store.status = true;

    const savedStore = await dataSource.getRepository(Store).save(store);
    const product = savedStore.products[0];
    return { store: savedStore, product };
  }

  it('should create an order and decrement stock', async () => {
    const buyer = await givenUserProfile(dataSource);
    const seller = await givenUserProfile(dataSource);
    const { store, product } = await createStoreWithProduct(seller);

    const optionA = product.productOptions.find((o) => o.name === 'Option A')!;

    const dto: ServiceCreateOrderDto = {
      cartId: 'cart-uuid-1',
      storeId: store.id,
      items: [
        {
          productId: product.id,
          productOptionId: optionA.id,
          quantity: 3,
        },
      ],
      userId: buyer.id,
    };

    const result = await service.createOrder(dto);

    expect(result.order).toBeDefined();
    expect(result.order.status).toBe(OrderRequestStatus.Pending);
    expect(result.order.items).toHaveLength(1);
    expect(result.order.items[0].productName).toBe('Test Product');
    expect(result.order.items[0].productValue).toBe(1000);
    expect(result.order.items[0].quantity).toBe(3);
    expect(result.whatsappUrl).toContain('wa.me');

    const updatedOption = await dataSource
      .getRepository(ProductOption)
      .findOne({ where: { id: optionA.id } });
    expect(updatedOption!.quantity).toBe(7);
  });

  it('should be idempotent via cartId', async () => {
    const buyer = await givenUserProfile(dataSource);
    const seller = await givenUserProfile(dataSource);
    const { store, product } = await createStoreWithProduct(seller);

    const optionA = product.productOptions.find((o) => o.name === 'Option A')!;

    const dto: ServiceCreateOrderDto = {
      cartId: 'cart-idempotent-1',
      storeId: store.id,
      items: [
        {
          productId: product.id,
          productOptionId: optionA.id,
          quantity: 2,
        },
      ],
      userId: buyer.id,
    };

    const first = await service.createOrder(dto);
    const second = await service.createOrder(dto);

    expect(first.order.id).toBe(second.order.id);

    const updatedOption = await dataSource
      .getRepository(ProductOption)
      .findOne({ where: { id: optionA.id } });
    expect(updatedOption!.quantity).toBe(8);
  });

  it('should throw OutOfStockError when quantity exceeds stock', async () => {
    const buyer = await givenUserProfile(dataSource);
    const seller = await givenUserProfile(dataSource);
    const { store, product } = await createStoreWithProduct(seller);

    const optionB = product.productOptions.find((o) => o.name === 'Option B')!;

    const dto: ServiceCreateOrderDto = {
      cartId: 'cart-oos-1',
      storeId: store.id,
      items: [
        {
          productId: product.id,
          productOptionId: optionB.id,
          quantity: 99,
        },
      ],
      userId: buyer.id,
    };

    await expect(service.createOrder(dto)).rejects.toThrow(OutOfStockError);
  });

  it('should allow store member to conclude an order', async () => {
    const buyer = await givenUserProfile(dataSource);
    const seller = await givenUserProfile(dataSource);
    const { store, product } = await createStoreWithProduct(seller);

    const optionA = product.productOptions.find((o) => o.name === 'Option A')!;

    const { order } = await service.createOrder({
      cartId: 'cart-conclude-1',
      storeId: store.id,
      items: [
        { productId: product.id, productOptionId: optionA.id, quantity: 1 },
      ],
      userId: buyer.id,
    });

    await service.conclude({ orderRequestId: order.id, userId: seller.id });

    const updated = await dataSource
      .getRepository(OrderRequest)
      .findOne({ where: { id: order.id } });
    expect(updated!.status).toBe(OrderRequestStatus.Concluded);
  });

  it('should allow store member to reject an order', async () => {
    const buyer = await givenUserProfile(dataSource);
    const seller = await givenUserProfile(dataSource);
    const { store, product } = await createStoreWithProduct(seller);

    const optionA = product.productOptions.find((o) => o.name === 'Option A')!;

    const { order } = await service.createOrder({
      cartId: 'cart-reject-1',
      storeId: store.id,
      items: [
        { productId: product.id, productOptionId: optionA.id, quantity: 1 },
      ],
      userId: buyer.id,
    });

    await service.reject({ orderRequestId: order.id, userId: seller.id });

    const updated = await dataSource
      .getRepository(OrderRequest)
      .findOne({ where: { id: order.id } });
    expect(updated!.status).toBe(OrderRequestStatus.Rejected);
  });

  it('should throw ForbiddenException when non-member tries to conclude', async () => {
    const buyer = await givenUserProfile(dataSource);
    const seller = await givenUserProfile(dataSource);
    const outsider = await givenUserProfile(dataSource);
    const { store, product } = await createStoreWithProduct(seller);

    const optionA = product.productOptions.find((o) => o.name === 'Option A')!;

    const { order } = await service.createOrder({
      cartId: 'cart-forbidden-1',
      storeId: store.id,
      items: [
        { productId: product.id, productOptionId: optionA.id, quantity: 1 },
      ],
      userId: buyer.id,
    });

    await expect(
      service.conclude({ orderRequestId: order.id, userId: outsider.id }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw InvalidOrderStatusTransitionError when concluding a non-pending order', async () => {
    const buyer = await givenUserProfile(dataSource);
    const seller = await givenUserProfile(dataSource);
    const { store, product } = await createStoreWithProduct(seller);

    const optionA = product.productOptions.find((o) => o.name === 'Option A')!;

    const { order } = await service.createOrder({
      cartId: 'cart-double-conclude-1',
      storeId: store.id,
      items: [
        { productId: product.id, productOptionId: optionA.id, quantity: 1 },
      ],
      userId: buyer.id,
    });

    await service.conclude({ orderRequestId: order.id, userId: seller.id });

    await expect(
      service.conclude({ orderRequestId: order.id, userId: seller.id }),
    ).rejects.toThrow(InvalidOrderStatusTransitionError);
  });
});
