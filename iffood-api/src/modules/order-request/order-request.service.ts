import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrderRequest, OrderRequestStatus } from './order-request.entity';
import { OrderRequestItem } from './order-request-item/order-request-item.entity';
import { OrderRequestRepository } from './order-request.repository';
import { ProductOption } from '../product/product-option/product-option.entity';
import { Product } from '../product/product.entity';
import { Store } from '../store/store.entity';
import { UserProfile } from '../user-profile/user-profile.entity';
import { OutOfStockError } from './domain/errors/out-of-stock.error';
import { MultipleStoresNotAllowedError } from './domain/errors/multiple-stores-not-allowed.error';
import {
  ServiceCreateOrderDto,
  ServiceUpdateOrderStatusDto,
  ServiceChangeAndConcludeDto,
} from './dto/order-request.service.dto';

@Injectable()
export class OrderRequestService {
  constructor(
    private readonly orderRequestRepository: OrderRequestRepository,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(dto: ServiceCreateOrderDto) {
    const existing = await this.orderRequestRepository.findByCartId(dto.cartId);
    if (existing) {
      return {
        order: existing,
        whatsappUrl: this.buildWhatsappUrl(existing),
      };
    }

    return this.dataSource.transaction(async (em) => {
      const optionIds = dto.items.map((i) => i.productOptionId);

      const productOptions = await em
        .getRepository(ProductOption)
        .createQueryBuilder('po')
        .innerJoinAndSelect('po.product', 'product')
        .innerJoinAndSelect('product.store', 'store')
        .whereInIds(optionIds)
        .setLock('pessimistic_write')
        .getMany();

      const optionMap = new Map<string, ProductOption>();
      for (const po of productOptions) {
        optionMap.set(po.id, po);
      }

      const storeIds = new Set<string>();
      for (const po of productOptions) {
        storeIds.add(po.product.store.id);
      }

      if (
        storeIds.size > 1 ||
        (storeIds.size === 1 && !storeIds.has(dto.storeId))
      ) {
        throw new MultipleStoresNotAllowedError();
      }

      if (storeIds.size === 0) {
        throw new NotFoundException('Product options not found');
      }

      for (const item of dto.items) {
        const option = optionMap.get(item.productOptionId);
        if (!option) {
          throw new NotFoundException(
            `Product option ${item.productOptionId} not found`,
          );
        }
        if (option.quantity < item.quantity) {
          throw new OutOfStockError(
            item.productOptionId,
            item.quantity,
            option.quantity,
          );
        }
      }

      const store = productOptions[0].product.store;
      const orderItems = dto.items.map((item) => {
        const option = optionMap.get(item.productOptionId)!;
        return OrderRequestItem.create({
          quantity: item.quantity,
          productName: option.product.name,
          productOptionName: option.name,
          productValue: option.product.value,
          product: { id: item.productId } as Product,
          productOption: { id: item.productOptionId } as ProductOption,
        });
      });

      const order = OrderRequest.create({
        cartId: dto.cartId,
        buyer: { id: dto.userId } as UserProfile,
        store: { id: dto.storeId } as Store,
        items: orderItems,
      });

      const savedOrder = await em.save(OrderRequest, order);
      savedOrder.store = store;

      return {
        order: savedOrder,
        whatsappUrl: this.buildWhatsappUrl(savedOrder),
      };
    });
  }

  async findByStoreId(storeId: string, userId: string) {
    const store = await this.dataSource.getRepository(Store).findOne({
      where: {
        id: storeId,
        storeUsers: { userProfile: { id: userId } },
      },
    });

    if (!store) {
      throw new ForbiddenException();
    }

    return this.orderRequestRepository.findByStoreId(
      storeId,
      OrderRequestStatus.Pending,
    );
  }

  async findById(id: string) {
    const order = await this.orderRequestRepository.findById(id);
    if (!order) {
      throw new NotFoundException();
    }
    return order;
  }

  async conclude(dto: ServiceUpdateOrderStatusDto) {
    const order = await this.findOrderForStoreUser(
      dto.orderRequestId,
      dto.userId,
    );

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderRequestId} not found`);
    }

    return this.dataSource.transaction(async (em) => {
      for (const item of order.items) {
        const productOption = item.productOption;
        productOption.changeQuantity(productOption.quantity - item.quantity);
      }

      await em.save(
        ProductOption,
        order.items.map((i) => i.productOption),
      );

      order.conclude();
      return em.save(OrderRequest, order);
    });
  }

  async reject(dto: ServiceUpdateOrderStatusDto) {
    const order = await this.findOrderForStoreUser(
      dto.orderRequestId,
      dto.userId,
    );

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderRequestId} not found`);
    }

    order.reject();
    return this.dataSource.getRepository(OrderRequest).save(order);
  }

  async changeAndConclude(dto: ServiceChangeAndConcludeDto) {
    const order = await this.findOrderForStoreUser(
      dto.orderRequestId,
      dto.userId,
    );

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderRequestId} not found`);
    }

    return this.dataSource.transaction(async (em) => {
      const optionIds = dto.items.map((i) => i.productOptionId);

      const productOptions = await em
        .getRepository(ProductOption)
        .createQueryBuilder('po')
        .innerJoinAndSelect('po.product', 'product')
        .innerJoinAndSelect('product.store', 'store')
        .whereInIds(optionIds)
        .setLock('pessimistic_write')
        .getMany();

      const optionMap = new Map<string, ProductOption>();
      for (const po of productOptions) {
        optionMap.set(po.id, po);
      }

      for (const po of productOptions) {
        if (po.product.store.id !== order.store.id) {
          throw new ForbiddenException();
        }
      }

      for (const item of dto.items) {
        const option = optionMap.get(item.productOptionId);
        if (!option) {
          throw new NotFoundException(
            `Product option ${item.productOptionId} not found`,
          );
        }
        if (option.quantity < item.quantity) {
          throw new OutOfStockError(
            item.productOptionId,
            item.quantity,
            option.quantity,
          );
        }
      }

      for (const item of dto.items) {
        const option = optionMap.get(item.productOptionId)!;
        option.changeQuantity(option.quantity - item.quantity);
      }
      await em.save(ProductOption, [...optionMap.values()]);

      await em.softRemove(OrderRequestItem, order.items);

      const newItems = dto.items.map((item) => {
        const option = optionMap.get(item.productOptionId)!;
        return OrderRequestItem.create({
          quantity: item.quantity,
          productName: option.product.name,
          productOptionName: option.name,
          productValue: option.product.value,
          product: { id: option.product.id } as Product,
          productOption: { id: option.id } as ProductOption,
        });
      });

      order.changeAndConclude(newItems);
      return em.save(OrderRequest, order);
    });
  }

  private async findOrderForStoreUser(
    orderRequestId: string,
    userId: string,
  ): Promise<OrderRequest> {
    const order = await this.orderRequestRepository.findByIdAndStoreUserId(
      orderRequestId,
      userId,
    );

    if (!order) {
      throw new ForbiddenException();
    }

    return order;
  }

  private buildWhatsappUrl(order: OrderRequest): string {
    const whatsapp = order.store.whatsapp;
    const itemsList = order.items
      .map((item) => {
        const price = ((item.productValue * item.quantity) / 100)
          .toFixed(2)
          .replace('.', ',');
        return `  • ${item.productName} ${item.productOptionName} (${item.quantity}x) - R$ ${price}`;
      })
      .join('\n');

    const total = order.items.reduce(
      (sum, item) => sum + item.productValue * item.quantity,
      0,
    );

    const message = `Olá! Acabei de fazer um pedido:\n\n${itemsList}\n\nTotal: R$ ${(total / 100).toFixed(2).replace('.', ',')}`;
    return `https://wa.me/55${whatsapp}?text=${encodeURIComponent(message)}`;
  }
}
