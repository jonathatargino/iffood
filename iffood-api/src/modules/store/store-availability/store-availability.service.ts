import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
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
    this.validateAvailabilityArray(availabilities);

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

  validateAvailabilityArray(
    availabilities: ServiceUpdateStoreAvailabilityDto['availabilities'],
  ) {
    const availabilityWeekdaySet = new Set<number>();

    for (const currentAvailability of availabilities) {
      const weekday = currentAvailability.weekday;
      if (availabilityWeekdaySet.has(weekday)) {
        throw new BadRequestException(
          `Duplicate availability for weekday ${weekday}`,
        );
      }

      if (currentAvailability.start >= currentAvailability.end) {
        throw new BadRequestException(
          `Invalid availability hours for weekday ${weekday}. End time must be after start time.`,
        );
      }

      availabilityWeekdaySet.add(weekday);
    }
  }
}
