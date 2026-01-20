import { Injectable } from '@nestjs/common';
import { StoreAvailability } from './store-availability.entity';
import {
  ListStoreAvailabilityResponseDto,
  ListStoreAvailabilityWithStoreIdResponseDto,
} from './dto/store-availability.response.dto';

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

  toListDtoWithStoreId(
    storeAvailabilities: StoreAvailability[],
  ): ListStoreAvailabilityWithStoreIdResponseDto {
    return {
      availabilities: storeAvailabilities.map((availability) => ({
        id: availability.id,
        weekday: availability.weekday,
        start: availability.start,
        end: availability.end,
      })),
      storeId: storeAvailabilities[0].store.id,
    };
  }
}
