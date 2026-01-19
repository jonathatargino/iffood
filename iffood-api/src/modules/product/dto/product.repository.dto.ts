import { CreateProductCoreDto } from './product.core.dto';

export interface RepositoryCreateProductDto extends CreateProductCoreDto {
  photoUrl: string;
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
