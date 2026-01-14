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
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { ProductCategory } from './product.entity';
import {
  CreateProductOptionDto,
  UpdateProductOptionDto,
} from './product-option/product-option.dto';
import { logger } from '../../common/logger';

export class CreateProductDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  value: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  storeId: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return plainToInstance(CreateProductOptionDto, parsed);
      } catch (error) {
        logger.error(error);
        return [];
      }
    }
    if (Array.isArray(value)) {
      return plainToInstance(CreateProductOptionDto, value);
    }
    return [];
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionDto)
  productOptions: CreateProductOptionDto[];
}

export class UpdateProductDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  @Min(0)
  @IsOptional()
  value: number;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsString()
  @IsOptional()
  description: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return plainToInstance(UpdateProductOptionDto, parsed);
      } catch (error) {
        logger.error(error);
        return [];
      }
    }
    if (Array.isArray(value)) {
      return plainToInstance(UpdateProductOptionDto, value);
    }
    return [];
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductOptionDto)
  @IsOptional()
  productOptions: UpdateProductOptionDto[];
}

export class CreateProductWithPhotoAndUserIdDto extends CreateProductDto {
  photo: Express.Multer.File;
  userId: string;
}

export class FullCreateProductDto extends CreateProductDto {
  photoUrl: string;
}

export class UpdateProductWithPhotoAndUserIdDto extends UpdateProductDto {
  photo?: Express.Multer.File;
  userId: string;
  id: string;
}
export class FullUpdateProductDto extends UpdateProductDto {
  photoUrl?: string;
}
export interface FindAllProductFilters {
  storeId?: string;
  name?: string;
  pageSize: number;
  page: number;
  withDeleted?: boolean;
  category?: ProductCategory;
}

export interface ProductWithCounts {
  id: string;
  value: number;
  name: string;
  description: string;
  photoUrl: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  productOptionsCount: number;
  accumulativeProductOptionsCount: number;
}
