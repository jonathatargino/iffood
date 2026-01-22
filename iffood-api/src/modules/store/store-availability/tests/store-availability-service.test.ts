import { Test } from '@nestjs/testing';
import { StoreAvailabilityService } from '../store-availability.service';
import { StoreAvailabilityRepository } from '../store-availability.repository';
import { DataSource } from 'typeorm';
import { ServiceUpdateStoreAvailabilityDto } from '../dto/store-availability.service.dto';

describe('StoreAvailability Service', () => {
  let storeAvailabilityService: StoreAvailabilityService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StoreAvailabilityService,
        { provide: StoreAvailabilityRepository, useValue: {} },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    storeAvailabilityService = moduleRef.get(StoreAvailabilityService);
  });

  it('(updateFullStoreAvailability) it should not throw error when receive valid availabilities', async () => {
    const inputAvailabilities: ServiceUpdateStoreAvailabilityDto['availabilities'] =
      [
        {
          end: '18:00',
          start: '09:00',
          weekday: 1,
        },
        {
          end: '18:00',
          start: '11:00',
          weekday: 2,
        },
        {
          end: '18:00',
          start: '10:00',
          weekday: 3,
        },
      ];

    await expect(async () => {
      await storeAvailabilityService.updateFullStoreAvailability({
        storeId: 'some-store-id',
        userId: 'some-user-id',
        availabilities: inputAvailabilities,
      });
    }).resolves.toEqual(undefined);
  });
});
