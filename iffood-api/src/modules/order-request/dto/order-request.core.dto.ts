export interface CreateOrderItemCoreDto {
  productId: string;
  productOptionId: string;
  quantity: number;
}

export interface CreateOrderCoreDto {
  cartId: string;
  storeId: string;
  items: CreateOrderItemCoreDto[];
}

export interface ChangeAndConcludeItemCoreDto {
  productName: string;
  productValue: number;
  quantity: number;
}

export interface ChangeAndConcludeCoreDto {
  items: ChangeAndConcludeItemCoreDto[];
}
