import { Injectable } from '@nestjs/common';
import { Store } from './store.entity';
import { DataSource, Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import { StoreUser } from '../store-user/store-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ImagesService } from '../images/images.service';

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
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly dataSource: DataSource,
    private fileService: FilesService,
    private imageService: ImagesService,
  ) {}

  async findByUserId(userId: string): Promise<Store[]> {
    const store = await this.storeRepository.find({
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

    return store;
  }

  async create(store: ServiceCreateStoreDto): Promise<Store> {
    await this.imageService.validate(store.photo.buffer);
    const processedPhoto = await this.imageService.process(store.photo.buffer);

    const photoUrl = await this.fileService.upload({
      fileBuffer: processedPhoto,
      mimeType: 'image/webp',
    });

    if (!photoUrl) {
      throw new Error('Error uploading file');
    }

    return this.dataSource.transaction(async (entityManager) => {
      const createdStore = entityManager.create(Store, {
        photoUrl,
        name: store.name,
        description: store.description,
        whatsapp: store.whatsapp,
        status: true,
      });

      await entityManager.save(createdStore);

      const createdStoreUser = entityManager.create(StoreUser, {
        store: {
          id: createdStore.id,
        },
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
  }: {
    storeId: string;
    name: string;
    description: string;
    whatsapp: string;
    userId: string;
  }) {
    const store = await this.storeRepository.findOne({
      where: {
        id: storeId,
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

    if (!store) {
      throw new Error('Store not found');
    }

    await this.storeRepository.update(
      { id: storeId },
      {
        name,
        description,
        whatsapp,
      },
    );
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
    const store = await this.storeRepository.findOne({
      where: {
        id: storeId,
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

    if (!store) {
      throw new Error('Store not found');
    }

    await this.imageService.validate(photo.buffer);
    const processedPhoto = await this.imageService.process(photo.buffer);

    const photoUrl = await this.fileService.upload({
      fileBuffer: processedPhoto,
      mimeType: 'image/webp',
    });

    if (!photoUrl) {
      throw new Error('Error uploading file');
    }

    await this.storeRepository.update(
      { id: storeId },
      {
        photoUrl,
      },
    );
  }

  async delete({
    userId,
    storeId,
  }: {
    userId: string;
    storeId: string;
  }): Promise<void> {
    const store = await this.storeRepository.findOne({
      where: {
        id: storeId,
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

    if (!store) {
      throw new Error('Store not found');
    }
    await this.storeRepository.softDelete({ id: store.id });
  }
}
