import { ApiProperty } from '@nestjs/swagger';
import { IsMilitaryTime, IsNumber, IsString, IsInt } from 'class-validator';

export class ListItemStoreAvailabilityResponseDtoUnit {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    type: Number,
    description: 'Day of the week as an integer (0 for Sunday, 6 for Saturday)',
  })
  @IsNumber()
  @IsInt()
  weekday: number;

  @ApiProperty({
    type: String,
    description: 'Store start time in HH:mm format (24-hour)',
  })
  @IsString()
  @IsMilitaryTime()
  start: string;

  @ApiProperty({
    type: String,
    description: 'Store end time in HH:mm format (24-hour)',
  })
  @IsString()
  @IsMilitaryTime()
  end: string;
}

export class ListStoreAvailabilityResponseDto {
  @ApiProperty({ type: [ListItemStoreAvailabilityResponseDtoUnit] })
  availabilities: ListItemStoreAvailabilityResponseDtoUnit[];
}

export class ListStoreAvailabilityWithStoreIdResponseDto {
  @ApiProperty({ type: [ListItemStoreAvailabilityResponseDtoUnit] })
  availabilities: ListItemStoreAvailabilityResponseDtoUnit[];

  @ApiProperty({ format: 'uuid' })
  storeId: string;
}
