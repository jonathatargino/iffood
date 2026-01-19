import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductOptionStatus } from './product-option.core.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ProductOptionBaseRequestDto {
  @ApiProperty({ type: Number })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateProductOptionRequestDto extends ProductOptionBaseRequestDto {}

export class UpdateProductOptionRequestDto extends ProductOptionBaseRequestDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Product option ID, if updating an existing option. If not present, a new option will be created.',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({ enum: ProductOptionStatus })
  @IsString()
  @IsEnum(ProductOptionStatus)
  status: ProductOptionStatus;
}
