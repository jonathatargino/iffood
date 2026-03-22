import { ForbiddenException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Store } from './store.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindAllStoreFilters } from './dto/store.core.dto';

@Injectable()
export class StoreRepository {
  constructor(
    @InjectRepository(Store) private typeormStoreRepository: Repository<Store>,
  ) {}

  async findAllActiveWithPositiveProductOptions(filters: FindAllStoreFilters) {
    const queryBuilder = this.typeormStoreRepository
      .createQueryBuilder('store')
      .leftJoin('store.products', 'product')
      .leftJoin('product.productOptions', 'productOption')
      .leftJoinAndSelect('store.storeAvailabilities', 'store_availabilities')
      .where('store.status = :status', { status: true });

    if (filters.name) {
      queryBuilder.andWhere('store.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters.weekday !== undefined && filters.hours) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1
          FROM store_availabilities sa
          WHERE sa.store_id = store.id
          AND sa.weekday = :weekday
          AND sa.start <= :hours
          AND sa.end >= :hours
        )`,
        {
          weekday: filters.weekday,
          hours: filters.hours,
        },
      );
    }

    queryBuilder
      .groupBy('store.id')
      .having('COALESCE(SUM(productOption.quantity), 0) > 0')
      .take(filters.pageSize)
      .skip((filters.page - 1) * filters.pageSize);

    const [stores, count] = await queryBuilder.getManyAndCount();

    return { stores, count };
  }

  async findThereIsAvailableStore({
    weekday,
    hours,
  }: {
    weekday: number;
    hours: string;
  }): Promise<boolean> {
    const exists = await this.typeormStoreRepository
      .createQueryBuilder('store')
      .leftJoin('store.products', 'product')
      .leftJoin('product.productOptions', 'productOption')
      .where('store.status = :status', { status: true })
      .andWhere('productOption.quantity > 0')
      .andWhere(
        `EXISTS (
      SELECT 1
      FROM store_availabilities sa
      WHERE sa.store_id = store.id
      AND sa.weekday = :weekday
      AND sa.start <= :hours
      AND sa.end >= :hours
    )`,
        { weekday, hours },
      )
      .limit(1)
      .getOne();

    return !!exists;
  }

  async findById(storeId: string): Promise<Store | null> {
    return this.typeormStoreRepository.findOne({
      where: { id: storeId },
      relations: {
        products: true,
        storeAvailabilities: true,
      },
    });
  }

  async findManyByUserId(userId: string): Promise<Store[]> {
    return this.typeormStoreRepository.find({
      where: {
        storeUsers: {
          userProfile: {
            id: userId,
          },
        },
      },
      relations: {
        storeAvailabilities: true,
      },
    });
  }

  async update({
    data,
    userId,
    storeId,
  }: {
    storeId: string;
    userId: string;
    data: Partial<Store>;
  }): Promise<Store> {
    const store = await this.typeormStoreRepository
      .createQueryBuilder('s')
      .innerJoin(
        'store_users',
        'su',
        'su.store_id = s.id AND su.user_profile_id = :userId',
        { userId },
      )
      .where('s.id = :storeId', { storeId })
      .getOne();

    if (!store) {
      throw new ForbiddenException();
    }

    store.updateDetails(data);
    return await this.typeormStoreRepository.save(store);
  }
}
