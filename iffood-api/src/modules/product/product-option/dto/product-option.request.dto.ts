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

export class CreateProductOptionRequestDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateProductOptionRequestDto {
  @IsString()
  @IsUUID()
  @IsOptional()
  id?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEnum(ProductOptionStatus)
  status: ProductOptionStatus;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
