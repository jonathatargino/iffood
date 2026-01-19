import { Injectable } from '@nestjs/common';
import { FindAllProductFilters } from './dto/product.request.dto';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProductWithCounts,
  RepositoryCreateProductDto,
} from './dto/product.repository.dto';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly typeormProductRepository: Repository<Product>,
  ) {}

  async findById({ productId }: { productId: string }) {
    const qb = this.typeormProductRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productOptions', 'productOption')
      .leftJoinAndSelect('product.store', 'store')
      .addSelect((sub) => {
        return sub
          .select('COALESCE(SUM(po.quantity), 0)')
          .from('product_options', 'po')
          .where('po.product_id = :productId', { productId });
      }, 'accumulativeProductOptionsCount')
      .where('product.id = :productId', { productId });

    const { entities, raw } = await qb.getRawAndEntities<{
      accumulativeProductOptionsCount: string;
    }>();

    const product = entities[0] ?? null;
    if (!product) return null;

    return {
      product: product,
      accumulativeProductOptionsCount: Number(
        raw[0].accumulativeProductOptionsCount,
      ),
    };
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
    const queryBuilder = this.typeormProductRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.productOptions', 'productOption')
      .leftJoinAndSelect('product.store', 'store')
      .where('store.status = :status', { status: true });

    if (filters.storeId) {
      queryBuilder.andWhere('product.store_id = :storeId', {
        storeId: filters.storeId,
      });
    }

    if (filters.category) {
      queryBuilder.andWhere('product.category = :category', {
        category: filters.category,
      });
    }

    if (filters.name) {
      queryBuilder.andWhere('product.name ILIKE %:name%', {
        name: filters.name,
      });
    }

    if (filters.weekday !== undefined && filters.hours) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1
          FROM store_availabilities sa
          WHERE sa.store_id = store.id
          AND sa.weekday = :weekday
          AND sa.start <= :hours
          AND sa.end >= :hours
        )`,
        {
          weekday: filters.weekday,
          hours: filters.hours,
        },
      );
    }

    queryBuilder
      .groupBy('product.id, productOption.id, store.id')
      .having('COALESCE(SUM(productOption.quantity), 0) > 0')
      .take(filters.pageSize)
      .skip((filters.page - 1) * filters.pageSize);

    const [products, count] = await queryBuilder.getManyAndCount();
    return { products, count };
  }

  async create(data: RepositoryCreateProductDto) {
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
