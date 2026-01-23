import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Store } from '../store.entity';
import { StoreAvailabilityRepository } from './store-availability.repository';
import { StoreAvailability } from './store-availability.entity';
import { ServiceUpdateStoreAvailabilityDto } from './dto/store-availability.service.dto';

@Injectable()
export class StoreAvailabilityService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storeAvailabilityRepository: StoreAvailabilityRepository,
  ) {}

  async findByStoreId(storeId: string) {
    const result =
      await this.storeAvailabilityRepository.findByStoreId(storeId);
    return result;
  }

  // Testar. Está de fato substituindo as avaliabilities antigas?
  // OBS: Integration test.
  updateFullStoreAvailability({
    storeId,
    userId,
    availabilities,
  }: ServiceUpdateStoreAvailabilityDto) {
    return this.dataSource.transaction(async (entityManager) => {
      const store = await entityManager.findOne(Store, {
        where: {
          id: storeId,
          storeUsers: {
            userProfile: {
              id: userId,
            },
          },
        },
        relations: { storeAvailabilities: true },
      });

      if (!store) {
        throw new ForbiddenException();
      }

      const newAvailabilities = availabilities.map(({ end, start, weekday }) =>
        StoreAvailability.create({
          start,
          end,
          weekday,
          store: {
            id: storeId,
          } as Store,
        }),
      );

      store.setAvailabilities(newAvailabilities);

      const result = await entityManager.save(Store, store);
      return result.storeAvailabilities;
    });
  }
}
