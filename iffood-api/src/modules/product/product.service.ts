import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindAllProductFilters } from './dto/product.request.dto';
import { ProductRepository } from './product.repository';
import { StoreUserService } from '../store/store-user/store-user.service';
import { DataSource } from 'typeorm';
import { Product } from './product.entity';
import { ProductOption } from './product-option/product-option.entity';
import { ImagesService } from '../../infra/images/images.service';
import {
  ServiceCreateProductDto,
  ServiceUpdateProductDto,
} from './dto/product.service.dto';
import { Store } from '../store/store.entity';
@Injectable()
export class ProductService {
  constructor(
    private readonly imageService: ImagesService,
    private readonly productRepository: ProductRepository,
    private readonly storeUserService: StoreUserService,
    private readonly dataSource: DataSource,
  ) {}

  async findById({ productId }: { productId: string }) {
    const product = await this.productRepository.findById({ productId });
    if (!product) {
      throw new NotFoundException();
    }

    return product;
  }

  async findAllWithTotalCountByStoreId({ storeId }: { storeId: string }) {
    return this.productRepository.findAllWithCounts({ storeId });
  }

  async findAll(filters: FindAllProductFilters) {
    const result = await this.productRepository.findAllAvailable(filters);
    return result;
  }

  async createProductWithOptions(dto: ServiceCreateProductDto) {
    const isAllowed = await this.storeUserService.isUserStoreMember({
      storeId: dto.storeId,
      userProfileId: dto.userId,
    });

    if (!isAllowed) {
      throw new ForbiddenException();
    }

    const photoUrl = await this.imageService.upload(dto.photoBuffer);
    const productOptions = dto.productOptions.map((option) =>
      ProductOption.create({
        name: option.name,
        quantity: option.quantity,
      }),
    );

    return this.dataSource.transaction(async (entityManager) => {
      const product = Product.create({
        description: dto.description,
        name: dto.name,
        photoUrl,
        value: dto.value,
        category: dto.category,
        store: { id: dto.storeId } as Store,
        productOptions,
      });

      return await entityManager.save(Product, product);
    });
  }

  async updateProductWithOptions(dto: ServiceUpdateProductDto) {
    const newPhotoUrl = dto.photoBuffer
      ? await this.imageService.upload(dto.photoBuffer)
      : undefined;

    return this.dataSource.transaction(async (entityManager) => {
      let toDelete: ProductOption[] = [];

      const product = await entityManager.findOne(Product, {
        where: {
          id: dto.id,
          store: { storeUsers: { userProfile: { id: dto.userId } } },
        },
        relations: { productOptions: true },
      });

      if (!product) {
        throw new ForbiddenException();
      }

      product.updateDetails({
        photoUrl: newPhotoUrl,
        category: dto.category,
        name: dto.name,
        description: dto.description,
        value: dto.value,
      });

      if (dto.productOptions) {
        const result = product.applyOptionsChange(dto.productOptions);
        toDelete = result.toDelete;
      }

      if (toDelete && toDelete.length > 0) {
        await entityManager.softRemove(ProductOption, toDelete);
      }

      await entityManager.save(Product, product);
      return product;
    });
  }

  async delete({ productId, userId }: { productId: string; userId: string }) {
    const isDeleted = await this.productRepository.delete({
      productId,
      userId,
    });

    if (!isDeleted) {
      throw new ForbiddenException();
    }

    return true;
  }
}
