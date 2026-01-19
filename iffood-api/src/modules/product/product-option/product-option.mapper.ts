import { Injectable } from '@nestjs/common';
import { ProductOption } from './product-option.entity';
import { ProductOptionResponseDto } from './dto/product-option.response.dto';

@Injectable()
export class ProductOptionMapper {
  toDto(productOption: ProductOption): ProductOptionResponseDto {
    return {
      id: productOption.id,
      name: productOption.name,
      quantity: productOption.quantity,
    };
  }
}
