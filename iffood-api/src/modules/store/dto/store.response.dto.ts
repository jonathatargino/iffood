import { ApiProperty } from '@nestjs/swagger';
import { BaseProductResponseDto } from '../../product/dto/product.response.dto';
import { ReviewResponseDto } from '../../review/dto/review.response.dto';

export class BaseStoreResponseDto {
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

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  rating: number;
}

export class StoreWithProductsResponseDto extends BaseStoreResponseDto {
  @ApiProperty({ type: () => BaseProductResponseDto, isArray: true })
  products: BaseProductResponseDto[];

  @ApiProperty({ type: () => ReviewResponseDto, isArray: true })
  reviews: ReviewResponseDto[];
}

export class PaginatedStoresResponseDto {
  @ApiProperty({ type: () => BaseStoreResponseDto, isArray: true })
  stores: BaseStoreResponseDto[];

  @ApiProperty({ type: Number, example: 10 })
  count: number;
}

export class IsAvailableStoreResponseDto {
  @ApiProperty({
    description: 'Indicates if there is at least one available store',
  })
  available: boolean;
}
