import { Injectable } from '@nestjs/common';
import { BaseProductResponseDto } from './dto/product.response.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductBaseMapper {
  constructor() {}

  toDto(product: Product): BaseProductResponseDto {
    return {
      category: product.category,
      description: product.description,
      id: product.id,
      name: product.name,
      photoUrl: product.photoUrl,
      value: product.value,
    };
  }
}
