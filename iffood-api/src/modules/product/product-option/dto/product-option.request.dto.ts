import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
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

export class UpdateProductOptionUnitRequestDto extends ProductOptionBaseRequestDto {
  @ApiPropertyOptional({
    format: 'uuid',
  })
  @IsString()
  @IsUUID()
  id: string;
}

export class UpdateProductOptionRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductOptionUnitRequestDto)
  updated: UpdateProductOptionUnitRequestDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductOptionUnitRequestDto)
  deleted: UpdateProductOptionUnitRequestDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionBaseRequestDto)
  new: ProductOptionBaseRequestDto[];
}
