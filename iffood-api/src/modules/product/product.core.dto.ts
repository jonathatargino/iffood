import {
  CreateProductOptionCoreDto,
  UpdateProductOptionCoreDto,
} from './product-option/dto/product-option.core.dto';
import { ProductCategory } from './product.entity';

export interface BaseProductCoreDto {
  value: number;
  name: string;
  category: ProductCategory;
  description: string;
}

export interface CreateProductCoreDto extends BaseProductCoreDto {
  storeId: string;
  productOptions: CreateProductOptionCoreDto[];
}

export interface UpdateProductCoreDto extends BaseProductCoreDto {
  productOptions: UpdateProductOptionCoreDto[];
}
