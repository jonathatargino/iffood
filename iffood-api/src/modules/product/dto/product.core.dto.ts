import {
  CreateProductOptionCoreDto,
  UpdateProductOptionCoreDto,
} from '../product-option/dto/product-option.core.dto';
import { ProductCategory } from '../product.entity';

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

export interface FindAllProductFilters {
  storeId?: string;
  name?: string;
  pageSize: number;
  page: number;
  withDeleted?: boolean;
  category?: ProductCategory;
  weekday?: number;
  hours?: string;
}
