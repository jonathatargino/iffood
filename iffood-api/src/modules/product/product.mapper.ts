import { Injectable } from '@nestjs/common';
import {
  ProductDetailsResponseDto,
  ProductListResponseDto,
} from './product.response.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductMapper {
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
      },
      productOptions: product.productOptions.map((option) => ({
        id: option.id,
        name: option.name,
        quantity: option.quantity,
      })),
      accumulativeProductOptionsCount,
    };
  }

  toListDto({
    products,
    count,
  }: {
    products: Product[];
    count: number;
  }): ProductListResponseDto {
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
      })),
      count: count,
    };
  }
}
