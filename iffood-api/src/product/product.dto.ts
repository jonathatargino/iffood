import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateProductOptionDto } from '../product-option/product-option.dto';
import { Transform, Type, plainToInstance } from 'class-transformer';

export class CreateProductDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  @Min(0)
  value: number;

  @IsString()
  @IsNotEmpty()
  name: string;

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
        console.error('Failed to parse productOptions:', error);
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

export class CreateProductWithPhotoAndUserIdDto extends CreateProductDto {
  photo: Express.Multer.File;
  userId: string;
}

export class FullCreateProductDto extends CreateProductDto {
  photoUrl: string;
}

export interface FindAllProductFilters {
  storeId?: string;
  name?: string;
  pageSize: number;
  page: number;
}
