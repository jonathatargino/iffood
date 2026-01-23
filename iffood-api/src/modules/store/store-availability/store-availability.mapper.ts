import { Injectable } from '@nestjs/common';
import { StoreAvailability } from './store-availability.entity';
import { ListStoreAvailabilityResponseDto } from './dto/store-availability.response.dto';

@Injectable()
export class StoreAvailabilityMapper {
  toListDto(
    storeAvailabilities: StoreAvailability[],
  ): ListStoreAvailabilityResponseDto {
    return {
      availabilities: storeAvailabilities.map((availability) => ({
        id: availability.id,
        weekday: availability.weekday,
        start: availability.start,
        end: availability.end,
      })),
    };
  }
}
