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
        TypeOrmModule.forFeature([StoreRepository]),
      ],
      providers: [
        StoreService,
        {
          provide: ImagesService,
          useValue: {
            upload: jest.fn().mockResolvedValue('http://image.url/photo.jpg'),
          },
        },
        {
          provide: StoreRepository,
          useValue: {},
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
    await dataSource.query(`TRUNCATE TABLE store_users, stores CASCADE;`);
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
});
