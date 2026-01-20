import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsMilitaryTime,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { STORE_CONSTRAINTS } from '../../../common/validation/constraints/store-constraints';
import { FindAllStoreFilters } from './store.core.dto';
import { STORE_AVAILABILITY_CONSTRAINTS } from '../../../common/validation/constraints/store-availability-constraints';
import { Type } from 'class-transformer';

export class BaseStoreRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(STORE_CONSTRAINTS.NAME_MIN, STORE_CONSTRAINTS.NAME_MAX)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(STORE_CONSTRAINTS.DESCRIPTION_MIN, STORE_CONSTRAINTS.DESCRIPTION_MAX)
  description: string;

  @ApiProperty({ description: 'Whatsapp number (format: DDD + 9XXXXXXXX)' })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}

export class CreateStoreRequestDto extends BaseStoreRequestDto {}

export class UpdateStoreRequestDto extends PartialType(BaseStoreRequestDto) {
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class SwaggerCreateStoreRequestDto extends CreateStoreRequestDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  photo: Express.Multer.File;
}

export class SwaggerUpdateStoreRequestDto extends UpdateStoreRequestDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  photo: Express.Multer.File;
}

export class FindAllStoresQueryDto implements FindAllStoreFilters {
  @Type(() => Number)
  @ApiPropertyOptional({ default: 20, maximum: 500 })
  @IsNumber()
  @IsInt()
  @IsOptional()
  @Max(500)
  pageSize: number = 20;

  @Type(() => Number)
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Length(0, STORE_CONSTRAINTS.NAME_MAX)
  name?: string;

  @Type(() => Number)
  @ApiPropertyOptional({ description: '0 (Sunday) to 6 (Saturday)' })
  @IsNumber()
  @IsInt()
  @Min(STORE_AVAILABILITY_CONSTRAINTS.WEEKDAY_MIN)
  @Max(STORE_AVAILABILITY_CONSTRAINTS.WEEKDAY_MAX)
  @IsOptional()
  weekday?: number;

  @ApiPropertyOptional({ description: 'Time in HH:mm format (24-hour)' })
  @IsString()
  @IsMilitaryTime()
  @IsOptional()
  hours?: string;
}
