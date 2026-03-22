import { Injectable } from '@nestjs/common';
import { OrderRequest } from './order-request.entity';
import {
  OrderRequestResponseDto,
  CreateOrderResponseDto,
} from './dto/order-request.response.dto';
import { OrderRequestItemMapper } from './order-request-item/order-request-item.mapper';

@Injectable()
export class OrderRequestMapper {
  constructor(
    private readonly orderRequestItemMapper: OrderRequestItemMapper,
  ) {}

  toDto(order: OrderRequest): OrderRequestResponseDto {
    const items = (order.items || []).map((item) =>
      this.orderRequestItemMapper.toDto(item),
    );

    const total = items.reduce(
      (sum, item) => sum + item.productValue * item.quantity,
      0,
    );

    return {
      id: order.id,
      status: order.status,
      cartId: order.cartId,
      createdAt: order.createdAt,
      storeId: order.store?.id,
      storeName: order.store?.name,
      buyerUserId: order.buyer?.id,
      buyerName: order.buyer?.name,
      buyerPhotoUrl: order.buyer?.photoUrl ?? null,
      buyerWhatsapp: order.buyer?.whatsapp ?? null,
      items,
      total,
    };
  }

  toListDto(orders: OrderRequest[]): OrderRequestResponseDto[] {
    return orders.map((order) => this.toDto(order));
  }

  toCreateResponseDto(
    orderId: string,
    whatsappUrl: string,
  ): CreateOrderResponseDto {
    return {
      orderRequestId: orderId,
      whatsappUrl,
    };
  }
}
