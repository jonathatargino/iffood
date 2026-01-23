import { ProductOption } from '../product-option/product-option.entity';
import { CreateProductCoreDto } from './product.core.dto';

export interface RepositoryCreateProductDto extends Omit<
  CreateProductCoreDto,
  'productOptions'
> {
  photoUrl: string;
  productOptions: ProductOption[];
}

export interface ProductWithCounts {
  id: string;
  value: number;
  name: string;
  description: string;
  photoUrl: string;
  category: string;
  productOptionsCount: number;
  accumulativeProductOptionsCount: number;
}
