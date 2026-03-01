import { Injectable } from '@nestjs/common';
import { OrderRequestItem } from './order-request-item.entity';
import { OrderRequestItemResponseDto } from '../dto/order-request.response.dto';

@Injectable()
export class OrderRequestItemMapper {
  toDto(item: OrderRequestItem): OrderRequestItemResponseDto {
    return {
      id: item.id,
      quantity: item.quantity,
      productName: item.productName,
      productValue: item.productValue,
      productId: item.product?.id,
      productOptionId: item.productOption?.id,
    };
  }
}
