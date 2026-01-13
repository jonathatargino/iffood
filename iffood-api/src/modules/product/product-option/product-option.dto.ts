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

export enum ProductOptionStatus {
  Updated = 'updated',
  Deleted = 'deleted',
  New = 'new',
}
export class CreateProductOptionDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateProductOptionDto {
  @IsString()
  @IsUUID()
  @IsOptional()
  id?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  quantity?: number;

  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsEnum(ProductOptionStatus)
  status: ProductOptionStatus;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
