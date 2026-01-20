import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsMilitaryTime,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { STORE_AVAILABILITY_CONSTRAINTS } from '../../../../common/validation/constraints/store-availability-constraints';

export class UpdateStoreAvailabilityRequestDtoUnit {
  @ApiProperty({
    type: Number,
    description: 'Day of the week as an integer (0 for Sunday, 6 for Saturday)',
  })
  @IsNumber()
  @IsInt()
  @Min(STORE_AVAILABILITY_CONSTRAINTS.WEEKDAY_MIN)
  @Max(STORE_AVAILABILITY_CONSTRAINTS.WEEKDAY_MAX)
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

export class UpdateStoreAvailabilityRequestDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  availabilities: UpdateStoreAvailabilityRequestDtoUnit[];

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storeId: string;
}
