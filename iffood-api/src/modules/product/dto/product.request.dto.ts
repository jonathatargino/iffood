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
  IsMilitaryTime,
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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Transforms due request are multipart/form-data and all values are strings
 */
class BaseProductRequestBodyDto {
  @ApiProperty({ type: Number })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  @IsNotEmpty()
  @Min(PRODUCT_CONSTRAINTS.VALUE_MIN)
  @Max(PRODUCT_CONSTRAINTS.VALUE_MAX)
  value: number;

  @ApiProperty()
  @Transform(({ value }) => forceTrim(value))
  @IsString()
  @IsNotEmpty()
  @Length(PRODUCT_CONSTRAINTS.NAME_MIN, PRODUCT_CONSTRAINTS.NAME_MAX)
  name: string;

  @ApiProperty({ enum: ProductCategory })
  @Transform(({ value }) => forceTrim(value))
  @IsString()
  @IsNotEmpty()
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty()
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
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  storeId: string;

  @ApiProperty({ type: [CreateProductOptionRequestDto] })
  @Transform(({ value }) =>
    plainToInstance(CreateProductOptionRequestDto, parseJson(value)),
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionRequestDto)
  productOptions: CreateProductOptionRequestDto[];
}

export class UpdateProductRequestBodyDto extends BaseProductRequestBodyDto {
  @ApiProperty({ type: [UpdateProductOptionRequestDto] })
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

export class FindAllProductQueryDto implements FindAllProductFilters {
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'UUID',
  })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ProductCategory })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @ApiPropertyOptional({
    description: '0-6 (sunday-saturday)',
    minimum: 0,
    maximum: 6,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  weekday?: number;

  @ApiPropertyOptional({ example: '10:00', description: 'HH:mm' })
  @IsOptional()
  @IsString()
  @IsMilitaryTime()
  hours?: string;
}

export class ProductDashboardQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  storeId: string;
}

export class SwaggerCreateProductRequestBodyDto extends CreateProductRequestBodyDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  photo: any;
}

export class SwaggerUpdateProductRequestBodyDto extends UpdateProductRequestBodyDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  photo: any;
}
