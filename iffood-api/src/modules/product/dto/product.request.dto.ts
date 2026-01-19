import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  Max,
  Length,
  IsUUID,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { ProductCategory } from '../product.entity';
import { PRODUCT_CONSTRAINTS } from '../../../common/validation/constraints/product-constraints';
import { forceTrim } from '../../../utils/maybe-trim';
import {
  CreateProductOptionRequestDto,
  UpdateProductOptionRequestDto,
} from '../product-option/dto/product-option.request.dto';
import { parseJson } from '../../../utils/parse-json';

/**
 * Transforms due request are multipart/form-data and all values are strings
 */
class BaseProductRequestBodyDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  @IsNotEmpty()
  @Min(PRODUCT_CONSTRAINTS.VALUE_MIN)
  @Max(PRODUCT_CONSTRAINTS.VALUE_MAX)
  value: number;

  @Transform(({ value }) => forceTrim(value))
  @IsString()
  @IsNotEmpty()
  @Length(PRODUCT_CONSTRAINTS.NAME_MIN, PRODUCT_CONSTRAINTS.NAME_MAX)
  name: string;

  @Transform(({ value }) => forceTrim(value))
  @IsString()
  @IsNotEmpty()
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @Transform(({ value }) => forceTrim(value))
  @IsString()
  @IsNotEmpty()
  @Length(
    PRODUCT_CONSTRAINTS.DESCRIPTION_MIN,
    PRODUCT_CONSTRAINTS.DESCRIPTION_MAX,
  )
  description: string;
}

export class CreateProductRequestBodyDto extends BaseProductRequestBodyDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  storeId: string;

  @Transform(({ value }) =>
    plainToInstance(CreateProductOptionRequestDto, parseJson(value)),
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionRequestDto)
  productOptions: CreateProductOptionRequestDto[];
}

export class UpdateProductRequestBodyDto extends BaseProductRequestBodyDto {
  @Transform(({ value }) =>
    plainToInstance(UpdateProductOptionRequestDto, parseJson(value)),
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductOptionRequestDto)
  @IsOptional()
  productOptions: UpdateProductOptionRequestDto[];
}

export interface FindAllProductFilters {
  storeId?: string;
  name?: string;
  pageSize: number;
  page: number;
  withDeleted?: boolean;
  category?: ProductCategory;
  weekday?: number;
  hours?: string;
}
