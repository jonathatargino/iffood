import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FindAllProductFilters,
  FullCreateProductDto,
  ProductWithCounts,
} from './product.dto';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, MoreThan, Repository } from 'typeorm';

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

    if (!result) {
      throw new NotFoundException();
    }
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
        productOptions: {
          quantity: MoreThan(0),
        },
        category: filters.category,
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

  async findAllWithCounts(params: {
    storeId: string;
  }): Promise<{ total: number; products: ProductWithCounts[] }> {
    const { storeId } = params;

    const queryBuilder = this.typeormProductRepository
      .createQueryBuilder('product')
      .leftJoin('product.productOptions', 'productOption')
      .where('product.store_id = :storeId', { storeId })
      .withDeleted()
      .select('product.id', 'id')
      .addSelect('product.value', 'value')
      .addSelect('product.name', 'name')
      .addSelect('product.description', 'description')
      .addSelect('product.photo_url', 'photoUrl')
      .addSelect('product.created_at', 'createdAt')
      .addSelect('product.updated_at', 'updatedAt')
      .addSelect('product.deleted_at', 'deletedAt')
      .addSelect('COUNT(productOption.id)', 'productOptionsCount')
      .addSelect(
        'COALESCE(SUM(productOption.quantity), 0)',
        'accumulativeProductOptionsCount',
      )
      .groupBy('product.id');

    const rawProducts = await queryBuilder.getRawMany<{
      id: string;
      value: number;
      name: string;
      description: string;
      photoUrl: string;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
      productOptionsCount: string;
      accumulativeProductOptionsCount: string;
    }>();

    const products: ProductWithCounts[] = rawProducts.map((p) => ({
      id: p.id,
      value: p.value,
      name: p.name,
      description: p.description,
      photoUrl: p.photoUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      deletedAt: p.deletedAt ?? undefined,
      productOptionsCount: parseInt(p.productOptionsCount, 10),
      accumulativeProductOptionsCount: parseInt(
        p.accumulativeProductOptionsCount,
        10,
      ),
    }));

    return {
      total: products.length,
      products,
    };
  }
}
