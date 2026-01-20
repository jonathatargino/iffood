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
      });

      if (!store) {
        throw new ForbiddenException();
      }

      await entityManager.delete(StoreAvailability, { store: { id: storeId } });

      const newAvailabilities = availabilities.map((availability) => {
        return entityManager.create(StoreAvailability, {
          ...availability,
          store: {
            id: storeId,
          },
        });
      });

      return await entityManager.save(StoreAvailability, newAvailabilities);
    });
  }
}
