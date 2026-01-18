import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Store } from './store.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreUser } from './store-user/store-user.entity';
import { FindAllStoreFilters } from './store.dto';

@Injectable()
export class StoreRepository {
  constructor(
    @InjectRepository(Store) private typeormStoreRepository: Repository<Store>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllActiveWithPositiveProductOptions(filters: FindAllStoreFilters) {
    const queryBuilder = this.typeormStoreRepository
      .createQueryBuilder('store')
      .leftJoin('store.products', 'product')
      .leftJoin('product.productOptions', 'productOption')
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
        storeUsers: {
          userProfile: true,
        },
      },
    });
  }

  async create({
    data,
    userId,
  }: {
    data: Partial<Store>;
    userId: string;
  }): Promise<Store> {
    return this.dataSource.transaction(async (entityManager) => {
      const createdStore = entityManager.create(Store, {
        photoUrl: data.photoUrl,
        name: data.name,
        description: data.description,
        whatsapp: data.whatsapp,
        status: true,
      });

      await entityManager.save(createdStore);

      const createdStoreUser = entityManager.create(StoreUser, {
        store: {
          id: createdStore.id,
        },
        userProfile: {
          id: userId,
        },
      });

      await entityManager.save(createdStoreUser);

      return createdStore;
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
  }): Promise<boolean> {
    const result = await this.typeormStoreRepository
      .createQueryBuilder()
      .update(data)
      .where('id = :storeId', { storeId })
      .andWhere(
        `EXISTS (
          SELECT 1 
          FROM store_users su 
          WHERE su.store_id = :storeId 
          AND su.user_profile_id = :userId
        )`,
      )
      .setParameters({ storeId, userId })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  async delete({
    storeId,
    userId,
  }: {
    storeId: string;
    userId: string;
  }): Promise<boolean> {
    const store = await this.typeormStoreRepository.findOne({
      where: { id: storeId, storeUsers: { userProfile: { id: userId } } },
      relations: {
        storeUsers: {
          userProfile: true,
        },
        products: {
          productOptions: true,
        },
      },
    });

    if (!store) return false;

    const result = await this.typeormStoreRepository.softRemove(store);

    return !!result;
  }
}
