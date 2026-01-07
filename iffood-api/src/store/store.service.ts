import { Injectable } from '@nestjs/common';
import { Store } from './store.entity';
import { DataSource } from 'typeorm';
import { FilesService } from '../files/files.service';
import { StoreUser } from '../store-user/store-user.entity';

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
    private readonly dataSource: DataSource,
    private fileService: FilesService,
  ) {}

  async create(store: ServiceCreateStoreDto): Promise<Store> {
    const photoUrl = await this.fileService.upload({
      fileBuffer: store.photo.buffer,
      mimeType: store.photo.mimetype,
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
}
