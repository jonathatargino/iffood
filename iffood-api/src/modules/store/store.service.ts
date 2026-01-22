import { Injectable, NotFoundException } from '@nestjs/common';
import { Store } from './store.entity';
import { StoreRepository } from './store.repository';
import { ImagesService } from '../../infra/images/images.service';
import { FindAllStoreFilters } from './dto/store.core.dto';
import { ServiceCreateStoreDto } from './dto/store.service.dto';
import { DataSource } from 'typeorm';
import { StoreUser } from './store-user/store-user.entity';

@Injectable()
export class StoreService {
  constructor(
    private readonly storeRepository: StoreRepository,
    private imageService: ImagesService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(filters: FindAllStoreFilters) {
    const stores =
      await this.storeRepository.findAllActiveWithPositiveProductOptions(
        filters,
      );
    return stores;
  }

  async findThereIsAvailableStore({
    weekday,
    hours,
  }: {
    weekday: number;
    hours: string;
  }) {
    const exists = await this.storeRepository.findThereIsAvailableStore({
      weekday,
      hours,
    });
    return { available: exists };
  }

  async findById(storeId: string): Promise<Store> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundException();
    }
    return store;
  }

  async findByUserId(userId: string): Promise<Store[]> {
    const stores = await this.storeRepository.findManyByUserId(userId);
    return stores;
  }

  // Test this
  async create(store: ServiceCreateStoreDto): Promise<Store> {
    const photoUrl = await this.imageService.upload(store.photoBuffer);

    return this.dataSource.transaction(async (entityManager) => {
      const createdStore = Store.create({
        name: store.name,
        description: store.description,
        whatsapp: store.whatsapp,
        photoUrl,
      });

      await entityManager.save(createdStore);

      const createdStoreUser = entityManager.create(StoreUser, {
        store: createdStore,
        userProfile: {
          id: store.userId,
        },
      });

      await entityManager.save(createdStoreUser);

      return createdStore;
    });
  }

  async update({
    description,
    name,
    storeId,
    whatsapp,
    userId,
    status,
  }: {
    storeId: string;
    name?: string;
    description?: string;
    whatsapp?: string;
    status?: boolean;
    userId: string;
  }) {
    const isUpdated = await this.storeRepository.update({
      data: {
        name,
        description,
        whatsapp,
        status,
      },
      storeId,
      userId,
    });

    if (!isUpdated) {
      throw new NotFoundException();
    }
  }

  async updatePhoto({
    storeId,
    photo,
    userId,
  }: {
    storeId: string;
    photo: Express.Multer.File;
    userId: string;
  }) {
    const photoUrl = await this.imageService.upload(photo.buffer);

    const isUpdated = await this.storeRepository.update({
      data: {
        photoUrl,
      },
      storeId,
      userId,
    });

    if (!isUpdated) {
      throw new NotFoundException();
    }
  }

  async delete({
    userId,
    storeId,
  }: {
    userId: string;
    storeId: string;
  }): Promise<void> {
    const isDeleted = await this.storeRepository.delete({ storeId, userId });

    if (!isDeleted) {
      throw new NotFoundException();
    }
  }
}
