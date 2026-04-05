import { Injectable } from '@nestjs/common';
import {
  ProductDashboardResponseDto,
  ProductDetailsResponseDto,
  PaginatedProductListResponseDto,
  SingleProductResponseDto,
  SingleProductWithBaseStoreResponseDto,
} from './dto/product.response.dto';
import { Product } from './product.entity';
import { ProductWithCounts } from './dto/product.repository.dto';
import { ProductOptionMapper } from './product-option/product-option.mapper';
import { StoreBaseMapper } from '../store/store.base.mapper';

@Injectable()
export class ProductMapper {
  constructor(
    private readonly productOptionMapper: ProductOptionMapper,
    private readonly storeBaseMapper: StoreBaseMapper,
  ) {}

  toDto(product: Product): SingleProductResponseDto {
    return {
      category: product.category,
      description: product.description,
      id: product.id,
      name: product.name,
      photoUrl: product.photoUrl,
      value: product.value,
      productOptions: product.productOptions.map((option) =>
        this.productOptionMapper.toDto(option),
      ),
    };
  }

  toWithStoreDto(product: Product): SingleProductWithBaseStoreResponseDto {
    return {
      category: product.category,
      description: product.description,
      id: product.id,
      name: product.name,
      photoUrl: product.photoUrl,
      value: product.value,
      productOptions: product.productOptions.map((option) =>
        this.productOptionMapper.toDto(option),
      ),
      store: this.storeBaseMapper.toDto(product.store),
    };
  }

  toDetailsDto({
    product,
    accumulativeProductOptionsCount,
  }: {
    product: Product;
    accumulativeProductOptionsCount: number;
  }): ProductDetailsResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      value: product.value,
      photoUrl: product.photoUrl,
      store: {
        id: product.store.id,
        name: product.store.name,
        description: product.store.description,
        whatsapp: product.store.whatsapp,
        photoUrl: product.store.photoUrl,
        status: product.store.status,
        isAvailable: product.store.isAvailable,
        rating: product.store.rating,
      },
      productOptions: product.productOptions.map((option) =>
        this.productOptionMapper.toDto(option),
      ),
      accumulativeProductOptionsCount,
    };
  }

  toListDto({
    products,
    count,
  }: {
    products: Product[];
    count: number;
  }): PaginatedProductListResponseDto {
    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        value: product.value,
        photoUrl: product.photoUrl,
        store: {
          name: product.store.name,
        },
        productOptions: product.productOptions.map((option) =>
          this.productOptionMapper.toDto(option),
        ),
      })),
      count: count,
    };
  }

  toDashboardDto({
    products,
    total,
  }: {
    total: number;
    products: ProductWithCounts[];
  }): ProductDashboardResponseDto {
    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        value: product.value,
        photoUrl: product.photoUrl,
        category: product.category,
        productOptionsCount: product.productOptionsCount,
        accumulativeProductOptionsCount:
          product.accumulativeProductOptionsCount,
      })),
      total: total,
    };
  }
}
