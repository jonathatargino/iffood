import { ApiProperty } from '@nestjs/swagger';
import { ProductOptionResponseDto } from '../product-option/dto/product-option.response.dto';
import { BaseStoreResponseDto } from '../../store/dto/store.response.dto';

export class BaseProductResponseDto {
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
  @ApiProperty({ type: () => BaseStoreResponseDto })
  store: BaseStoreResponseDto;

  @ApiProperty({ type: () => ProductOptionResponseDto, isArray: true })
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

  @ApiProperty({ type: () => ProductOptionResponseDto, isArray: true })
  productOptions: ProductOptionResponseDto[];
}

export class PaginatedProductListResponseDto {
  @ApiProperty({ type: () => ProductListItemResponseDto, isArray: true })
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
  @ApiProperty({
    type: () => ProductDashboardListItemResponseDto,
    isArray: true,
  })
  products: ProductDashboardListItemResponseDto[];

  @ApiProperty({ type: Number, example: 42 })
  total: number;
}

export class SingleProductResponseDto extends BaseProductResponseDto {
  @ApiProperty({ type: () => ProductOptionResponseDto, isArray: true })
  productOptions: ProductOptionResponseDto[];
}

export class SingleProductWithBaseStoreResponseDto extends SingleProductResponseDto {
  @ApiProperty({ type: () => BaseStoreResponseDto })
  store: BaseStoreResponseDto;
}
