import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductOptionStatus } from './product-option.core.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PRODUCT_OPTION_CONSTRAINTS } from '../../../../common/validation/constraints/product-option-constraints';

class ProductOptionBaseRequestDto {
  @ApiProperty({ type: Number })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  @Max(PRODUCT_OPTION_CONSTRAINTS.QUANTITY_MAX)
  @Min(PRODUCT_OPTION_CONSTRAINTS.QUANTITY_MIN)
  quantity: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(
    PRODUCT_OPTION_CONSTRAINTS.NAME_MIN,
    PRODUCT_OPTION_CONSTRAINTS.NAME_MAX,
  )
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
