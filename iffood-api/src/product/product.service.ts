import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  CreateProductWithPhotoAndUserIdDto,
  FindAllProductFilters,
} from './product.dto';
import { ImagesService } from '../images/images.service';
import { ProductRepository } from './product.repository';
import { StoreUserService } from '../store-user/store-user.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly imageService: ImagesService,
    private readonly productRepository: ProductRepository,
    private readonly storeUserService: StoreUserService,
  ) {}

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
    });

    return result;
  }
}
