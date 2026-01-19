export enum ProductOptionStatus {
  Updated = 'updated',
  Deleted = 'deleted',
}

export interface CreateProductOptionCoreDto {
  name: string;
  quantity: number;
}

export interface UpdateProductOptionCoreDto {
  id?: string;
  name: string;
  quantity: number;
  status: ProductOptionStatus;
}
