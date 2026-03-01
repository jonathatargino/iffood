import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  productOptionId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  cartId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ type: [CreateOrderItemRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemRequestDto)
  items: CreateOrderItemRequestDto[];
}

export class ChangeAndConcludeItemRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty()
  @IsNumber()
  @IsInt()
  @Min(0)
  productValue: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class ChangeAndConcludeRequestDto {
  @ApiProperty({ type: [ChangeAndConcludeItemRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangeAndConcludeItemRequestDto)
  items: ChangeAndConcludeItemRequestDto[];
}

export class FindOrdersByStoreQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  storeId: string;
}
