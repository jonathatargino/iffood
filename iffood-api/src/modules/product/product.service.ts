import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  CreateProductWithPhotoAndUserIdDto,
  FindAllProductFilters,
  UpdateProductWithPhotoAndUserIdDto,
} from './product.dto';
import { ProductRepository } from './product.repository';
import { StoreUserService } from '../store/store-user/store-user.service';
import { DataSource } from 'typeorm';
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
    const result = await this.productRepository.findById({ productId });
    const accumulativeProductOptionsCount = result?.productOptions.reduce(
      (acc, option) => acc + option.quantity,
      0,
    );
    return { ...result, accumulativeProductOptionsCount };
  }

  async findAllWithCountByStoreId({ storeId }: { storeId: string }) {
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
    return this.dataSource.transaction(async (entityManager) => {
      const product = await entityManager.findOne(Product, {
        where: {
          id: dto.id,
          store: { storeUsers: { userProfile: { id: dto.userId } } },
        },
        relations: { productOptions: true, store: { storeUsers: true } },
      });

      if (!product) {
        throw new ForbiddenException();
      }

      let photoUrl: string | undefined = product.photoUrl;
      if (dto.photo) {
        photoUrl = await this.imageService.upload(dto.photo.buffer);
      }

      product.photoUrl = photoUrl ?? product.photoUrl;
      product.category = dto.category ?? product.category;
      product.name = dto.name ?? product.name;
      product.description = dto.description ?? product.description;
      product.value = dto.value ?? product.value;

      if (dto.productOptions) {
        const dtoProductOptionsMap = dto.productOptions.reduce(
          (map, option) => {
            if (option.id) {
              map[option.id] = option;
            } else {
              (map.new as UpdateProductOptionDto[]).push(option);
            }
            return map;
          },
          { new: [] } as Record<
            string,
            UpdateProductOptionDto | UpdateProductOptionDto[]
          >,
        );

        product.productOptions = product.productOptions.map((option) => {
          const dtoOption = dtoProductOptionsMap[
            option.id
          ] as UpdateProductOptionDto;

          if (!dtoOption) return option;

          if (dtoOption.status === ProductOptionStatus.Updated) {
            option.name = dtoOption.name ?? option.name;
            option.quantity = dtoOption.quantity ?? option.quantity;
            return option;
          }

          if (dtoOption.status === ProductOptionStatus.Deleted) {
            option.deletedAt = new Date();
            return option;
          }

          return option;
        });

        for (const newOption of dtoProductOptionsMap.new as UpdateProductOptionDto[]) {
          product.productOptions.push(
            entityManager.create(ProductOption, {
              name: newOption.name,
              quantity: newOption.quantity,
            }),
          );
        }
      }

      await entityManager.save(Product, product);
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

    return;
  }
}
