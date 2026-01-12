import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductOptionDto {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  name: string;
}
