import { ApiProperty } from '@nestjs/swagger';

export class OrderRequestItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productOptionName: string;

  @ApiProperty()
  productValue: number;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ format: 'uuid' })
  productOptionId: string;
}

export class OrderRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ format: 'uuid' })
  cartId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ format: 'uuid' })
  storeId: string;

  @ApiProperty()
  storeName: string;

  @ApiProperty({ format: 'uuid' })
  buyerUserId: string;

  @ApiProperty()
  buyerName: string;

  @ApiProperty({ type: [OrderRequestItemResponseDto] })
  items: OrderRequestItemResponseDto[];

  @ApiProperty()
  total: number;
}

export class CreateOrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  orderRequestId: string;

  @ApiProperty()
  whatsappUrl: string;
}
