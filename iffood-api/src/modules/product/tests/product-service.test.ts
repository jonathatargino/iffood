import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { ProductService } from '../product.service';
import { Product, ProductCategory } from '../product.entity';
import { ProductRepository } from '../product.repository';
import { Store } from '../../store/store.entity';
import { ServiceCreateStoreDto } from '../../store/dto/store.service.dto';
import { givenUserProfile } from '../../store/tests/helpers/given-user-profile';
import { StoreAvailability } from '../../store/store-availability/store-availability.entity';
import { ProductOption } from '../product-option/product-option.entity';
import { StoreUser } from '../../store/store-user/store-user.entity';
import { ImagesService } from '../../../infra/images/images.service';
import { StoreUserService } from '../../store/store-user/store-user.service';
import {
  ServiceCreateProductDto,
  ServiceUpdateProductDto,
} from '../dto/product.service.dto';

jest.setTimeout(60_000);

describe('Product Service', () => {
  let productService: ProductService;
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
          entities: [join(process.cwd(), 'src/**/*.entity{.ts,.js}')],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Product]),
      ],
      providers: [
        ProductService,
        ProductRepository,
        {
          provide: ImagesService,
          useValue: {
            upload: jest.fn().mockResolvedValue('http://image.url/photo.jpg'),
          },
        },
        {
          provide: StoreUserService,
          useValue: {
            isUserStoreMember: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    productService = moduleRef.get(ProductService);
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await dataSource.query(`TRUNCATE TABLE product_options, products CASCADE;`);
  });

  it('findAll() should return only available products', async () => {
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
            ProductOption.create({ name: 'Store 1 - Option 1', quantity: 5 }),
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
            ProductOption.create({ name: 'Store 2 - Option 1', quantity: 5 }),
            ProductOption.create({ name: 'Store 2 - Option 2', quantity: 8 }),
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
            ProductOption.create({
              name: 'Unavailable Store 1 - Option 1',
              quantity: 5,
            }),
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
            ProductOption.create({
              name: 'Unavailable Store 2 - Option 1',
              quantity: 5,
            }),
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
            ProductOption.create({
              name: 'Unavailable Store 3 - Option 1',
              quantity: 0,
            }),
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

    const productsResult = await productService.findAll({
      weekday: 1,
      hours: '10:00',
      page: 1,
      pageSize: 10,
    });

    expect(productsResult.count).toBe(2);
    const productsNames = productsResult.products.map((p) => p.name);
    expect(productsNames).toContain('Product 1');
    expect(productsNames).toContain('Product 2');
  });

  it("createProductWithOptions() should create a product with it's options", async () => {
    const userProfile = await givenUserProfile(dataSource);
    const store = Store.create({
      name: 'Product Store',
      description: 'A store for testing',
      whatsapp: '85985454176',
      photoUrl: 'http://image.url/photo.jpg',
      storeUsers: [{ userProfile } as StoreUser],
    });
    store.status = true;

    await dataSource.getRepository(Store).save(store);

    const dto: ServiceCreateProductDto = {
      name: 'Test Product',
      description: 'A product for testing',
      value: 25,
      category: ProductCategory.Savory,
      photoBuffer: Buffer.from('fake-image-buffer'),
      storeId: store.id,
      productOptions: [
        { name: 'Option 1', quantity: 10 },
        { name: 'Option 2', quantity: 15 },
      ],
      userId: userProfile.id,
    };

    const createdProduct = await productService.createProductWithOptions(dto);

    expect(createdProduct).toBeDefined();

    const productInDb = await dataSource.getRepository(Product).findOne({
      where: { id: createdProduct.id },
      relations: { productOptions: true, store: true },
    });

    expect(productInDb).toBeDefined();
    expect(productInDb!.name).toBe(dto.name);
    expect(productInDb!.description).toBe(dto.description);
    expect(productInDb!.value).toBe(dto.value);
    expect(productInDb!.category).toBe(dto.category);
    expect(productInDb!.photoUrl).toBe('http://image.url/photo.jpg');
    expect(productInDb!.store.id).toBe(store.id);
    expect(productInDb!.productOptions).toHaveLength(2);

    const optionNames = productInDb!.productOptions.map((opt) => opt.name);
    expect(optionNames).toContain('Option 1');
    expect(optionNames).toContain('Option 2');
  });

  it("updateProductWithOptions() should update a product's details and its options", async () => {
    const userProfile = await givenUserProfile(dataSource);
    const store = Store.create({
      name: 'Product Store',
      description: 'A store for testing',
      whatsapp: '85985454176',
      photoUrl: 'http://image.url/photo.jpg',
      storeUsers: [{ userProfile } as StoreUser],
    });
    store.status = true;

    await dataSource.getRepository(Store).save(store);

    const product = Product.create({
      name: 'Original Product',
      description: 'Original description',
      value: 30,
      category: ProductCategory.Savory,
      photoUrl: 'http://image.url/original-product.jpg',
      store: store,
      productOptions: [
        ProductOption.create({ name: 'Original Option 1', quantity: 10 }),
        ProductOption.create({ name: 'Original Option 2', quantity: 20 }),
        ProductOption.create({ name: 'Original Option 3', quantity: 30 }),
      ],
    });

    await dataSource.getRepository(Product).save(product);

    const dto: ServiceUpdateProductDto = {
      id: product.id,
      name: 'Updated Product',
      value: 35,
      category: ProductCategory.Sweet,
      photoBuffer: Buffer.from('new-fake-image-buffer'),
      productOptions: {
        deleted: [product.productOptions[1]],
        new: [{ name: 'New Option 4', quantity: 40 }],
        updated: [
          {
            id: product.productOptions[0].id,
            name: 'Updated Option 1',
            quantity: 15,
          },
        ],
      },
      userId: userProfile.id,
    };

    const updatedProduct = await productService.updateProductWithOptions(dto);

    expect(updatedProduct).toBeDefined();

    const productInDb = await dataSource.getRepository(Product).findOne({
      where: { id: updatedProduct.id },
      relations: { productOptions: true, store: true },
    });

    expect(productInDb).toBeDefined();
    expect(productInDb!.name).toBe(dto.name);
    expect(productInDb!.description).toBe(product.description);
    expect(productInDb!.value).toBe(dto.value);
    expect(productInDb!.category).toBe(dto.category);
    expect(productInDb!.store.id).toBe(store.id);
    expect(productInDb!.productOptions).toHaveLength(3);

    const optionNames = productInDb!.productOptions.map((opt) => opt.name);
    expect(optionNames).toContain('Updated Option 1');
    expect(optionNames).toContain('Original Option 3');
    expect(optionNames).toContain('New Option 4');
  });
});
