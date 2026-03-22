import {
  CreateOrderCoreDto,
  ChangeAndConcludeCoreDto,
} from './order-request.core.dto';

export interface ServiceCreateOrderDto extends CreateOrderCoreDto {
  userId: string;
}

export interface ServiceChangeAndConcludeDto extends ChangeAndConcludeCoreDto {
  orderRequestId: string;
  userId: string;
}

export interface ServiceUpdateOrderStatusDto {
  orderRequestId: string;
  userId: string;
}
