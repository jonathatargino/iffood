import { ApiProperty } from '@nestjs/swagger';
import { ProductOptionResponseDto } from '../product-option/dto/product-option.response.dto';

class StoreResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  whatsapp: string;

  @ApiProperty()
  photoUrl: string;

  @ApiProperty()
  status: boolean;
}

class BaseProductResponseDto {
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

  @ApiProperty()
  photoUrl: string;
}

export class ProductDetailsResponseDto extends BaseProductResponseDto {
  @ApiProperty({ type: StoreResponseDto })
  store: StoreResponseDto;

  @ApiProperty({ type: [ProductOptionResponseDto] })
  productOptions: ProductOptionResponseDto[];

  @ApiProperty({ type: Number, example: 7 })
  accumulativeProductOptionsCount: number;
}

class StoreNameDto {
  @ApiProperty()
  name: string;
}

class ProductListItemResponseDto extends BaseProductResponseDto {
  @ApiProperty({ type: StoreNameDto })
  store: StoreNameDto;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductListItemResponseDto] })
  products: ProductListItemResponseDto[];

  @ApiProperty({ type: Number, example: 42 })
  count: number;
}

class ProductDashboardListItemResponseDto extends BaseProductResponseDto {
  @ApiProperty({ type: Number, example: 7 })
  accumulativeProductOptionsCount: number;

  @ApiProperty({ type: Number, example: 3 })
  productOptionsCount: number;
}

export class ProductDashboardResponseDto {
  @ApiProperty({ type: [ProductDashboardListItemResponseDto] })
  products: ProductDashboardListItemResponseDto[];

  @ApiProperty({ type: Number, example: 42 })
  total: number;
}

export class SingleProductResponseDto extends BaseProductResponseDto {
  @ApiProperty({ type: [ProductOptionResponseDto] })
  productOptions: ProductOptionResponseDto[];
}

export class SingleProductWithStoreResponseDto extends SingleProductResponseDto {
  @ApiProperty({ type: StoreResponseDto })
  store: StoreResponseDto;
}
