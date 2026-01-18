import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateProductWithPhotoAndUserIdDto,
  FindAllProductFilters,
  UpdateProductWithPhotoAndUserIdDto,
} from './product.dto';
import { ProductRepository } from './product.repository';
import { StoreUserService } from '../store/store-user/store-user.service';
import { DataSource, EntityManager } from 'typeorm';
import { Product } from './product.entity';
import {
  ProductOptionStatus,
  UpdateProductOptionDto,
} from './product-option/product-option.dto';
import { ProductOption } from './product-option/product-option.entity';
import { ImagesService } from '../../infra/images/images.service';

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

  async findAllByStoreId(filters: FindAllProductFilters) {
    const result = await this.productRepository.findAll(filters);
    return result;
  }

  async createProductWithOptions(dto: CreateProductWithPhotoAndUserIdDto) {
    const isAllowed = await this.storeUserService.isUserStoreMember({
      storeId: dto.storeId,
      userProfileId: dto.userId,
    });

    if (!isAllowed) {
      throw new ForbiddenException();
    }

    const photoUrl = await this.imageService.upload(dto.photo.buffer);

    const result = await this.productRepository.create({
      description: dto.description,
      name: dto.name,
      photoUrl,
      productOptions: dto.productOptions,
      value: dto.value,
      storeId: dto.storeId,
      category: dto.category,
    });

    return result;
  }

  async updateProductWithOptions(dto: UpdateProductWithPhotoAndUserIdDto) {
    const newPhotoUrl = dto.photo
      ? await this.imageService.upload(dto.photo.buffer)
      : undefined;

    return this.dataSource.transaction(async (entityManager) => {
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
        await this.handleProductOptionsChanges({
          product,
          productOptionsChanges: dto.productOptions,
          entityManager,
        });
      }

      await entityManager.save(Product, product);
      return product;
    });
  }

  private async handleProductOptionsChanges({
    product,
    productOptionsChanges,
    entityManager,
  }: {
    product: Product;
    productOptionsChanges: UpdateProductOptionDto[];
    entityManager: EntityManager;
  }) {
    const { newProductOptions, existentProductOptionsChangesById } =
      this.splitNewAndExistingProductOptionsChanges(productOptionsChanges);

    product.productOptions = await Promise.all(
      product.productOptions.map(async (option) => {
        const optionChange = existentProductOptionsChangesById[option.id];

        if (!optionChange) return option;

        if (optionChange.status === ProductOptionStatus.Updated) {
          option.patch({
            name: optionChange.name,
            quantity: optionChange.quantity,
          });
          return option;
        }

        if (optionChange.status === ProductOptionStatus.Deleted) {
          return await entityManager.softRemove(ProductOption, option);
        }

        return option;
      }),
    );

    this.appendNewProductOptions({
      newProductOptions,
      product,
      entityManager,
    });
  }

  private splitNewAndExistingProductOptionsChanges(
    productOptionsChanges: UpdateProductOptionDto[],
  ) {
    const newProductOptions: UpdateProductOptionDto[] = [];
    const existentProductOptionsChangesById: Record<
      string,
      UpdateProductOptionDto
    > = {};

    for (const option of productOptionsChanges) {
      if (!option.id) {
        newProductOptions.push(option);
        continue;
      }

      existentProductOptionsChangesById[option.id] = option;
    }

    return { newProductOptions, existentProductOptionsChangesById };
  }

  private appendNewProductOptions({
    newProductOptions,
    product,
    entityManager,
  }: {
    product: Product;
    newProductOptions: UpdateProductOptionDto[];
    entityManager: EntityManager;
  }) {
    for (const newOption of newProductOptions) {
      product.productOptions.push(
        entityManager.create(ProductOption, {
          name: newOption.name,
          quantity: newOption.quantity,
          product,
        }),
      );
    }
  }

  async delete({ productId, userId }: { productId: string; userId: string }) {
    const isDeleted = await this.productRepository.delete({
      productId,
      userId,
    });

    if (!isDeleted) {
      throw new ForbiddenException();
    }

    return;
  }
}
