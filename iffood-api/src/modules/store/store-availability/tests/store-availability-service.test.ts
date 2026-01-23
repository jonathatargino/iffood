import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { StoreAvailability } from '../store-availability.entity';
import { DataSource } from 'typeorm';
import { StoreAvailabilityService } from '../store-availability.service';
import { StoreAvailabilityRepository } from '../store-availability.repository';
import { Store } from '../../store.entity';
import { StoreUser } from '../../store-user/store-user.entity';
import { givenUserProfile } from '../../tests/helpers/given-user-profile';
import { ServiceUpdateStoreAvailabilityDto } from '../dto/store-availability.service.dto';
import { join } from 'path';

jest.setTimeout(60_000);

describe('StoreAvailability Service', () => {
  let storeAvailabilityService: StoreAvailabilityService;
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
        TypeOrmModule.forFeature([StoreAvailability]),
      ],
      providers: [StoreAvailabilityService, StoreAvailabilityRepository],
    }).compile();

    storeAvailabilityService = moduleRef.get(StoreAvailabilityService);
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await dataSource.query(`TRUNCATE TABLE store_users, stores CASCADE;`);
  });

  it("updateFullStoreAvailability should replace store's availabilities", async () => {
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
    });
    store.status = true;

    await dataSource.getRepository(Store).save(store);

    const newAvailabilities: ServiceUpdateStoreAvailabilityDto['availabilities'] =
      [
        {
          end: '20:00',
          start: '10:00',
          weekday: 3,
        },
        {
          end: '22:00',
          start: '12:00',
          weekday: 5,
        },
      ];
    await storeAvailabilityService.updateFullStoreAvailability({
      storeId: store.id,
      userId: userProfile.id,
      availabilities: newAvailabilities,
    });

    const updatedStore = await dataSource.getRepository(Store).findOne({
      where: { id: store.id },
      relations: { storeAvailabilities: true },
    });

    expect(updatedStore).toBeDefined();
    expect(updatedStore!.storeAvailabilities).toHaveLength(2);

    const normalized = updatedStore!.storeAvailabilities
      .map((a) => ({
        weekday: a.weekday,
        start: a.start.slice(0, 5),
        end: a.end.slice(0, 5),
      }))
      .sort((a, b) => a.weekday - b.weekday);

    expect(normalized).toEqual([
      { weekday: 3, start: '10:00', end: '20:00' },
      { weekday: 5, start: '12:00', end: '22:00' },
    ]);
  });
});
