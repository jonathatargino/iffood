import { Injectable } from '@nestjs/common';
import { FindAllProductFilters, FullCreateProductDto } from './product.dto';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly typeormProductRepository: Repository<Product>,
  ) {}

  async findById({ productId }: { productId: string }) {
    const result = await this.typeormProductRepository.findOne({
      where: { id: productId },
      relations: { productOptions: true, store: true },
    });
    return result;
  }

  async findByIdAndUserId({
    productId,
    userId,
  }: {
    productId: string;
    userId: string;
  }) {
    const result = await this.typeormProductRepository.findOne({
      where: {
        id: productId,
        store: { storeUsers: { userProfile: { id: userId } } },
      },
      relations: { productOptions: true, store: { storeUsers: true } },
    });
    return result;
  }

  async findAll(filters: FindAllProductFilters) {
    const result = await this.typeormProductRepository.find({
      where: {
        store: { id: filters.storeId },
        name: filters.name ? ILike(`%${filters.name}%`) : undefined,
      },
      take: filters.pageSize,
      skip: filters.pageSize * (filters.page - 1),
      relations: {
        productOptions: true,
        store: true,
      },
      withDeleted: filters.withDeleted || false,
    });

    return result;
  }

  async create(data: FullCreateProductDto) {
    const result = await this.typeormProductRepository.save({
      ...data,
      store: { id: data.storeId },
    });
    return result;
  }

  async delete({ productId, userId }: { productId: string; userId: string }) {
    const productToDelete = await this.typeormProductRepository.findOne({
      where: {
        id: productId,
        store: { storeUsers: { userProfile: { id: userId } } },
      },
      relations: { productOptions: true, store: { storeUsers: true } },
    });

    if (!productToDelete) {
      return false;
    }

    await this.typeormProductRepository.softRemove(productToDelete);
    return true;
  }
}
