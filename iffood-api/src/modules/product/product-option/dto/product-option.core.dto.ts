export enum ProductOptionStatus {
  Updated = 'updated',
  Deleted = 'deleted',
  New = 'new',
}
export interface BaseProductOptionCoreDto {
  name: string;
  quantity: number;
}
export interface CreateProductOptionCoreDto extends BaseProductOptionCoreDto {}

export interface UpdateProductOptionUnitCoreDto extends BaseProductOptionCoreDto {
  id: string;
}

export type UpdateProductOptionCoreDto = Record<
  Exclude<ProductOptionStatus, ProductOptionStatus.New>,
  UpdateProductOptionUnitCoreDto[]
> &
  Record<ProductOptionStatus.New, Omit<UpdateProductOptionUnitCoreDto, 'id'>[]>;
