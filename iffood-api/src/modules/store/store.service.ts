import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Store } from './store.entity';
import { StoreRepository } from './store.repository';
import { ImagesService } from '../../infra/images/images.service';
import { FindAllStoreFilters } from './dto/store.core.dto';
import {
  ServiceCreateStoreDto,
  ServiceUpdateStoreDto,
} from './dto/store.service.dto';
import { DataSource } from 'typeorm';
import { StoreUser } from './store-user/store-user.entity';
import { UserProfile } from '../user-profile/user-profile.entity';
import { StoreAvailability } from './store-availability/store-availability.entity';
import { StoreCacheService } from './store-cache.service';
import { StoreMapper } from './store.mapper';

@Injectable()
export class StoreService {
  constructor(
    private readonly storeRepository: StoreRepository,
    private imageService: ImagesService,
    private readonly dataSource: DataSource,
    private readonly storeCacheService: StoreCacheService,
    private readonly storeMapper: StoreMapper,
  ) {}

  async findAll(filters: FindAllStoreFilters) {
    const stores =
      await this.storeRepository.findAllActiveWithPositiveProductOptions(
        filters,
      );
    return stores;
  }

  /**
   * Versão com cache Redis do findAll.
   * Retorna o DTO serializado diretamente para evitar dupla serialização.
   *
   * Fluxo:
   *   1. Verifica o Redis pela chave derivada dos filtros
   *   2. Cache HIT  → retorna resposta sem tocar o banco
   *   3. Cache MISS → executa a query, serializa com StoreMapper, grava no Redis
   */
  async findAllCached(filters: FindAllStoreFilters) {
    const key = this.storeCacheService.buildKey(filters);

    const cached = await this.storeCacheService.get(key);
    if (cached) {
      return cached;
    }

    const result =
      await this.storeRepository.findAllActiveWithPositiveProductOptions(
        filters,
      );

    const dto = this.storeMapper.toPaginatedDto(result);
    await this.storeCacheService.set(key, dto);

    return dto;
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
    const photoUrl = await this.imageService.upload(store.photoBuffer);

    return this.dataSource.transaction(async (entityManager) => {
      const createdStore = Store.create({
        name: store.name,
        description: store.description,
        whatsapp: store.whatsapp,
        photoUrl,
        storeUsers: [
          StoreUser.create({
            userProfile: { id: store.userId } as UserProfile,
          }),
        ],
      });

      return await entityManager.save(createdStore);
    });
  }

  async update({
    description,
    name,
    storeId,
    whatsapp,
    userId,
    status,
  }: ServiceUpdateStoreDto) {
    return await this.storeRepository.update({
      data: {
        name,
        description,
        whatsapp,
        status,
      },
      storeId,
      userId,
    });
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
  }): Promise<boolean> {
    return await this.dataSource.transaction(async (entityManager) => {
      const store = await entityManager.findOne(Store, {
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

      if (!store) throw new ForbiddenException();

      const result = await entityManager.softRemove(store);
      await entityManager.delete(StoreAvailability, { store: { id: storeId } });

      return !!result;
    });
  }
}
