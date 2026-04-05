import { Injectable } from '@nestjs/common';
import { Store } from './store.entity';
import {
  PaginatedStoresResponseDto,
  StoreWithProductsResponseDto,
} from './dto/store.response.dto';
import { ProductBaseMapper } from '../product/product.base.mapper';
import { ReviewMapper } from '../review/review.mapper';

@Injectable()
export class StoreMapper {
  constructor(
    private productBaseMapper: ProductBaseMapper,
    private reviewMapper: ReviewMapper,
  ) {}

  toDtoWithProducts(store: Store): StoreWithProductsResponseDto {
    return {
      id: store.id,
      name: store.name,
      description: store.description,
      whatsapp: store.whatsapp,
      photoUrl: store.photoUrl,
      status: store.status,
      products: store.products.map((product) =>
        this.productBaseMapper.toDto(product),
      ),
      isAvailable: store.isAvailable,
      rating: store.rating,
      reviews: store.reviews.map((review) => this.reviewMapper.toDto(review)),
    };
  }

  toListWithProductsDto(stores: Store[]): StoreWithProductsResponseDto[] {
    return stores.map((store) => this.toDtoWithProducts(store));
  }

  toPaginatedDto({
    stores,
    count,
  }: {
    stores: Store[];
    count: number;
  }): PaginatedStoresResponseDto {
    return {
      stores: stores.map((store) => ({
        id: store.id,
        name: store.name,
        description: store.description,
        whatsapp: store.whatsapp,
        photoUrl: store.photoUrl,
        status: store.status,
        isAvailable: store.isAvailable,
        rating: store.rating,
      })),
      count,
    };
  }
}
