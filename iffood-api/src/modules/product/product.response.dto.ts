import { ApiProperty } from '@nestjs/swagger';

class ProductOptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: Number, example: 7 })
  quantity: number;
}

class StoreResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  whatsapp: string;

  @ApiProperty({ nullable: true })
  photoUrl: string | null;

  @ApiProperty()
  status: boolean;
}

export class ProductDetailsResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ type: Number, example: 4990 })
  value: number;

  @ApiProperty({ nullable: true })
  photoUrl: string | null;

  @ApiProperty({ type: StoreResponseDto })
  store: StoreResponseDto;

  @ApiProperty({ type: [ProductOptionResponseDto] })
  productOptions: ProductOptionResponseDto[];

  @ApiProperty({ type: Number, example: 7 })
  accumulativeProductOptionsCount: number;
}
