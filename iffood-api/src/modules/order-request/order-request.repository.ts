import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderRequest, OrderRequestStatus } from './order-request.entity';

@Injectable()
export class OrderRequestRepository {
  constructor(
    @InjectRepository(OrderRequest)
    private readonly typeormRepository: Repository<OrderRequest>,
  ) {}

  async findByCartId(cartId: string): Promise<OrderRequest | null> {
    return this.typeormRepository.findOne({
      where: { cartId },
      relations: { store: true, buyer: true, items: true },
    });
  }

  async findById(id: string): Promise<OrderRequest | null> {
    return this.typeormRepository.findOne({
      where: { id },
      relations: {
        store: true,
        buyer: true,
        items: { product: true, productOption: true },
      },
    });
  }

  async findByStoreId(
    storeId: string,
    status?: OrderRequestStatus,
  ): Promise<OrderRequest[]> {
    return this.typeormRepository.find({
      where: { store: { id: storeId }, status },
      relations: { buyer: true, items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdAndStoreUserId(
    orderRequestId: string,
    userId: string,
  ): Promise<OrderRequest | null> {
    return this.typeormRepository.findOne({
      where: {
        id: orderRequestId,
        store: { storeUsers: { userProfile: { id: userId } } },
      },
      relations: {
        store: { storeUsers: true },
        buyer: true,
        items: {
          productOption: true,
        },
      },
    });
  }
}
