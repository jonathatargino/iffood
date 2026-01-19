import {
  BaseProductCoreDto,
  CreateProductCoreDto,
  UpdateProductCoreDto,
} from './product.core.dto';

interface ServiceBaseProductDto extends BaseProductCoreDto {
  photoBuffer: Buffer;
  userId: string;
}

export interface ServiceCreateProductDto
  extends ServiceBaseProductDto, CreateProductCoreDto {}

export interface ServiceUpdateProductDto
  extends ServiceBaseProductDto, UpdateProductCoreDto {
  id: string;
}
