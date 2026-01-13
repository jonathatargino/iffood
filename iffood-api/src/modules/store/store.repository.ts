import { Injectable } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { Store } from './store.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreUser } from '../store-user/store-user.entity';
import { FindAllStoreFilters } from './store.dto';

@Injectable()
export class StoreRepository {
  constructor(
    @InjectRepository(Store) private typeormStoreRepository: Repository<Store>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(filters: FindAllStoreFilters): Promise<Store[]> {
    return this.typeormStoreRepository.find({
      where: {
        name: filters.name ? ILike(`%${filters.name}%`) : undefined,
      },
    });
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
    const result = await this.typeormStoreRepository
      .createQueryBuilder()
      .softDelete()
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
}
