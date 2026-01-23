import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { StoreRepository } from '../store.repository';
import { StoreUser } from '../store-user/store-user.entity';
import { StoreService } from '../store.service';
import { ImagesService } from '../../../infra/images/images.service';
import { DataSource } from 'typeorm';
import { ServiceCreateStoreDto } from '../dto/store.service.dto';
import { givenUserProfile } from './helpers/given-user-profile';
import { Store } from '../store.entity';
import { Product, ProductCategory } from '../../product/product.entity';
import { StoreAvailability } from '../store-availability/store-availability.entity';
import { ProductOption } from '../../product/product-option/product-option.entity';
import { ForbiddenException } from '@nestjs/common';

jest.setTimeout(60_000);

describe('Store Service', () => {
  let storeService: StoreService;
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
          host: host,
          port: port,
          username: TEST_DB_ENV.POSTGRES_USER,
          password: TEST_DB_ENV.POSTGRES_PASSWORD,
          database: TEST_DB_ENV.POSTGRES_DB,
          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Store]),
      ],
      providers: [
        StoreService,
        StoreRepository,
        {
          provide: ImagesService,
          useValue: {
            upload: jest.fn().mockResolvedValue('http://image.url/photo.jpg'),
          },
        },
      ],
    }).compile();

    storeService = moduleRef.get<StoreService>(StoreService);
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE store_users, product_options, products, store_availabilities, store_users, user_profiles, stores CASCADE;`,
    );
  });

  it('(create) should create a store and a store user', async () => {
    const userProfile = await givenUserProfile(dataSource);

    const createStoreDto: ServiceCreateStoreDto = {
      name: 'Test Store',
      description: 'A store for testing',
      whatsapp: '85985454176',
      photoBuffer: Buffer.from('fake-image-data'),
      userId: userProfile.id,
    };

    const createdStore = await storeService.create(createStoreDto);

    expect(createdStore).toBeDefined();
    expect(createdStore.id).toBeDefined();
    expect(createdStore.name).toBe(createStoreDto.name);
    expect(createdStore.description).toBe(createStoreDto.description);
    expect(createdStore.whatsapp).toBe(createStoreDto.whatsapp);
    expect(createdStore.photoUrl).toBe('http://image.url/photo.jpg');

    const storeUser = await dataSource.getRepository(StoreUser).findOne({
      where: {
        store: { id: createdStore.id },
        userProfile: { id: userProfile.id },
      },
      relations: ['userProfile'],
    });

    expect(storeUser).toBeDefined();
  });

  it('findAll() should return only available stores', async () => {
    const userProfile = await givenUserProfile(dataSource);
    const createStoreDTOs: Omit<ServiceCreateStoreDto, 'photoBuffer'>[] = [
      {
        name: 'Available Store 1',
        description: 'First available store',
        whatsapp: '85985454176',
        userId: userProfile.id,
      },
      {
        name: 'Unavailable Store',
        description: 'Falsy status',
        whatsapp: '85985454177',
        userId: userProfile.id,
      },
      {
        name: 'Unavailable Store 2',
        description: 'None store availabilities matches',
        whatsapp: '85985454177',
        userId: userProfile.id,
      },
      {
        name: 'Unavailable Store 3',
        description: 'No products available',
        whatsapp: '85985454177',
        userId: userProfile.id,
      },
      {
        name: 'Available Store 2',
        description: 'Second available store',
        whatsapp: '85985454178',
        userId: userProfile.id,
      },
    ];

    const firstStore = Store.create({
      ...createStoreDTOs[0],
      photoUrl: 'http://image.url/photo1.jpg',
      availabilities: [
        StoreAvailability.create({ weekday: 1, start: '08:00', end: '18:00' }),
        StoreAvailability.create({ weekday: 2, start: '08:00', end: '18:00' }),
      ],
      products: [
        Product.create({
          name: 'Product 1',
          description: 'A product Lorem Ipsum',
          photoUrl: 'http://image.url/product1.jpg',
          value: 10,
          category: ProductCategory.Savory,
          productOptions: [
            ProductOption.create({ name: 'Option 1', quantity: 5 }),
          ],
        }),
      ],
      storeUsers: [{ userProfile } as StoreUser],
    });
    firstStore.status = true;

    const secondStore = Store.create({
      ...createStoreDTOs[4],
      photoUrl: 'http://image.url/photo2.jpg',
      availabilities: [
        StoreAvailability.create({ weekday: 1, start: '09:00', end: '17:00' }),
        StoreAvailability.create({ weekday: 3, start: '09:00', end: '17:00' }),
      ],
      products: [
        Product.create({
          name: 'Product 2',
          description: 'Another product',
          photoUrl: 'http://image.url/product2.jpg',
          value: 15,
          category: ProductCategory.Sweet,
          productOptions: [
            ProductOption.create({ name: 'Option 1', quantity: 5 }),
          ],
        }),
      ],
      storeUsers: [{ userProfile } as StoreUser],
    });
    secondStore.status = true;

    const unavailableStore1 = Store.create({
      ...createStoreDTOs[1],
      photoUrl: 'http://image.url/photo3.jpg',
      storeUsers: [{ userProfile } as StoreUser],
      availabilities: [
        StoreAvailability.create({ weekday: 1, start: '09:00', end: '17:00' }),
        StoreAvailability.create({ weekday: 3, start: '09:00', end: '17:00' }),
      ],
      products: [
        Product.create({
          name: 'Product 2',
          description: 'Another product',
          photoUrl: 'http://image.url/product2.jpg',
          value: 15,
          category: ProductCategory.Sweet,
          productOptions: [
            ProductOption.create({ name: 'Option 1', quantity: 5 }),
          ],
        }),
      ],
    });
    unavailableStore1.status = false;

    const unavailableStore2 = Store.create({
      ...createStoreDTOs[2],
      photoUrl: 'http://image.url/photo4.jpg',
      storeUsers: [{ userProfile } as StoreUser],
      availabilities: [
        StoreAvailability.create({ weekday: 2, start: '10:00', end: '15:00' }),
        StoreAvailability.create({ weekday: 4, start: '10:00', end: '15:00' }),
      ],
      products: [
        Product.create({
          name: 'Product 3',
          description: 'Yet another product',
          photoUrl: 'http://image.url/product3.jpg',
          value: 20,
          category: ProductCategory.Sweet,
          productOptions: [
            ProductOption.create({ name: 'Option 1', quantity: 5 }),
          ],
        }),
      ],
    });
    unavailableStore2.status = true;

    const unavailableStore3 = Store.create({
      ...createStoreDTOs[3],
      photoUrl: 'http://image.url/photo5.jpg',
      storeUsers: [{ userProfile } as StoreUser],
      availabilities: [
        StoreAvailability.create({ weekday: 1, start: '08:00', end: '18:00' }),
      ],
      products: [
        Product.create({
          name: 'Product 3',
          description: 'Yet another product',
          photoUrl: 'http://image.url/product3.jpg',
          value: 20,
          category: ProductCategory.Sweet,
          productOptions: [
            ProductOption.create({ name: 'Option 1', quantity: 0 }),
          ],
        }),
      ],
    });
    unavailableStore3.status = true;

    await dataSource
      .getRepository(Store)
      .save([
        firstStore,
        secondStore,
        unavailableStore1,
        unavailableStore2,
        unavailableStore3,
      ]);

    const stores = await storeService.findAll({
      page: 1,
      pageSize: 10,
      hours: '10:00',
      weekday: 1,
    });

    expect(stores.count).toBe(2);
    const storeNames = stores.stores.map((s) => s.name);
    expect(storeNames).toContain('Available Store 1');
    expect(storeNames).toContain('Available Store 2');
  });

  it('findThereIsAvailableStore() should return true when there is at least one store available', async () => {
    const userProfile = await givenUserProfile(dataSource);

    const store = Store.create({
      name: 'Available Store',
      description: 'A store for testing',
      whatsapp: '85985454176',
      photoUrl: 'http://image.url/photo.jpg',
      storeUsers: [{ userProfile } as StoreUser],
      availabilities: [
        StoreAvailability.create({ weekday: 1, start: '08:00', end: '18:00' }),
      ],
      products: [
        Product.create({
          name: 'Product 1',
          description: 'A product Lorem Ipsum',
          photoUrl: 'http://image.url/product1.jpg',
          value: 10,
          category: ProductCategory.Savory,
          productOptions: [
            ProductOption.create({ name: 'Option 1', quantity: 5 }),
          ],
        }),
      ],
    });
    store.status = true;

    await dataSource.getRepository(Store).save(store);

    const result = await storeService.findThereIsAvailableStore({
      weekday: 1,
      hours: '10:00',
    });

    expect(result.available).toBe(true);
  });

  it("findThereIsAvailableStore() should return false when there isn't any store available", async () => {
    const userProfile = await givenUserProfile(dataSource);

    const store = Store.create({
      name: 'Available Store',
      description: 'A store for testing',
      whatsapp: '85985454176',
      photoUrl: 'http://image.url/photo.jpg',
      storeUsers: [{ userProfile } as StoreUser],
      availabilities: [
        StoreAvailability.create({ weekday: 1, start: '08:00', end: '18:00' }),
      ],
      products: [
        Product.create({
          name: 'Product 1',
          description: 'A product Lorem Ipsum',
          photoUrl: 'http://image.url/product1.jpg',
          value: 10,
          category: ProductCategory.Savory,
          productOptions: [
            ProductOption.create({ name: 'Option 1', quantity: 5 }),
          ],
        }),
      ],
    });
    store.status = true;

    await dataSource.getRepository(Store).save(store);

    const result = await storeService.findThereIsAvailableStore({
      weekday: 2,
      hours: '10:00',
    });

    expect(result.available).toBe(false);
  });

  it("update() should throw ForbiddenException when user isn't store user", async () => {
    const userProfile = await givenUserProfile(dataSource);
    const anotherUserProfile = await givenUserProfile(dataSource);

    const store = Store.create({
      name: 'Store to Update',
      description: 'A store for testing',
      whatsapp: '85985454176',
      photoUrl: 'http://image.url/photo.jpg',
      storeUsers: [{ userProfile } as StoreUser],
    });
    store.status = true;

    await dataSource.getRepository(Store).save(store);

    await expect(
      storeService.update({
        storeId: store.id,
        userId: anotherUserProfile.id,
        description: 'Updated Description',
        name: 'Updated Name',
        whatsapp: '85900000000',
        status: false,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('update should update store when user is store user', async () => {
    const userProfile = await givenUserProfile(dataSource);

    const store = Store.create({
      name: 'Store to Update',
      description: 'A store for testing',
      whatsapp: '85985454176',
      photoUrl: 'http://image.url/photo.jpg',
      storeUsers: [{ userProfile } as StoreUser],
    });
    store.status = true;

    await dataSource.getRepository(Store).save(store);

    const updatedStore = await storeService.update({
      storeId: store.id,
      userId: userProfile.id,
      name: 'Updated Name',
      whatsapp: '85900000000',
      status: false,
    });

    expect(updatedStore).toBeDefined();
    expect(updatedStore.name).toBe('Updated Name');
    expect(updatedStore.description).toBe('A store for testing');
    expect(updatedStore.whatsapp).toBe('85900000000');
    expect(updatedStore.status).toBe(false);
  });

  it("delete() should throw ForbiddenException when user isn't store user", async () => {
    const userProfile = await givenUserProfile(dataSource);
    const anotherUserProfile = await givenUserProfile(dataSource);

    const store = Store.create({
      name: 'Store to Delete',
      description: 'A store for testing',
      whatsapp: '85985454176',
      photoUrl: 'http://image.url/photo.jpg',
      storeUsers: [{ userProfile } as StoreUser],
    });
    store.status = true;

    await dataSource.getRepository(Store).save(store);

    await expect(
      storeService.delete({
        storeId: store.id,
        userId: anotherUserProfile.id,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('delete() should soft delete the store and product, store availability & store user related entities', async () => {
    const userProfile = await givenUserProfile(dataSource);

    const store = Store.create({
      name: 'Store to Delete',
      description: 'A store for testing',
      whatsapp: '85985454176',
      photoUrl: 'http://image.url/photo.jpg',
      storeUsers: [{ userProfile } as StoreUser],
      availabilities: [
        StoreAvailability.create({ weekday: 1, start: '08:00', end: '18:00' }),
        StoreAvailability.create({ weekday: 2, start: '09:00', end: '17:00' }),
      ],
      products: [
        Product.create({
          name: 'Product 1',
          description: 'A product Lorem Ipsum',
          photoUrl: 'http://image.url/product1.jpg',
          value: 10,
          category: ProductCategory.Savory,
          productOptions: [
            ProductOption.create({ name: 'Option 1', quantity: 5 }),
          ],
        }),
      ],
    });
    store.status = true;

    await dataSource.getRepository(Store).save(store);

    await storeService.delete({
      storeId: store.id,
      userId: userProfile.id,
    });

    const storeInDb = await dataSource
      .getRepository(Store)
      .findOne({ where: { id: store.id }, withDeleted: true });
    expect(storeInDb).toBeDefined();
    expect(storeInDb!.deletedAt).toBeInstanceOf(Date);

    const storeAvailabilitiesInDb = await dataSource
      .getRepository(StoreAvailability)
      .find({ where: { store: { id: store.id } }, withDeleted: true });
    expect(storeAvailabilitiesInDb).toHaveLength(0);

    const productsInDb = await dataSource
      .getRepository(Product)
      .find({ where: { store: { id: store.id } }, withDeleted: true });
    expect(productsInDb).toHaveLength(1);
    productsInDb.forEach((product) => {
      expect(product.deletedAt).toBeInstanceOf(Date);
    });

    const storeUsersInDb = await dataSource
      .getRepository(StoreUser)
      .find({ where: { store: { id: store.id } }, withDeleted: true });
    expect(storeUsersInDb).toHaveLength(1);
    storeUsersInDb.forEach((storeUser) => {
      expect(storeUser.deletedAt).toBeInstanceOf(Date);
    });
  });
});
