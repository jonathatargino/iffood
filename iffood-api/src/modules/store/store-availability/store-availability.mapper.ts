import { Injectable } from '@nestjs/common';
import { StoreAvailability } from './store-availability.entity';
import { ListItemStoreAvailabilityResponseDtoUnit } from './dto/store-availability.response.dto';

@Injectable()
export class StoreAvailabilityMapper {
  toListDto(
    storeAvailabilities: StoreAvailability[],
  ): ListItemStoreAvailabilityResponseDtoUnit[] {
    return storeAvailabilities.map((availability) => ({
      id: availability.id,
      weekday: availability.weekday,
      start: availability.start,
      end: availability.end,
    }));
  }
}
