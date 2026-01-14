import { Injectable, NotFoundException } from '@nestjs/common';
import { Store } from './store.entity';
import { StoreRepository } from './store.repository';
import { FindAllStoreFilters } from './store.dto';
import { ImagesService } from '../../infra/images/images.service';

interface ServiceCreateStoreDto {
  name: string;
  description: string;
  whatsapp: string;
  photo: Express.Multer.File;
  userId: string;
}

@Injectable()
export class StoreService {
  constructor(
    private readonly storeRepository: StoreRepository,
    private imageService: ImagesService,
  ) {}

  async findAll(filters: FindAllStoreFilters) {
    const stores = await this.storeRepository.findAll(filters);
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

  async create(store: ServiceCreateStoreDto): Promise<Store> {
    const photoUrl = await this.imageService.upload(store.photo.buffer);

    const createdStore = await this.storeRepository.create({
      data: {
        name: store.name,
        description: store.description,
        whatsapp: store.whatsapp,
        photoUrl,
      },
      userId: store.userId,
    });

    return createdStore;
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
