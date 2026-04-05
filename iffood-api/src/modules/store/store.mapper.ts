import { Injectable } from '@nestjs/common';
import { Store } from './store.entity';
import {
  PaginatedStoresResponseDto,
  StoreWithProductsResponseDto,
} from './dto/store.response.dto';
import { ProductBaseMapper } from '../product/product.base.mapper';

@Injectable()
export class StoreMapper {
  constructor(private productBaseMapper: ProductBaseMapper) {}

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
