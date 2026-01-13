import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Store } from '../store.entity';
import { StoreAvailabilityRepository } from './store-availability.repository';
import { UpdateStoreAvailabilityWithUserIdDto } from './store-availability.dto';
import { StoreAvailability } from './store-availability.entity';

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
  }: UpdateStoreAvailabilityWithUserIdDto) {
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
        relations: {
          storeUsers: { userProfile: true },
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

      await entityManager.save(StoreAvailability, newAvailabilities);
    });
  }
}
