import { Injectable } from '@nestjs/common';
import { FullCreateProductDto } from './product.dto';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly typeormProductRepository: Repository<Product>,
  ) {}

  async create(data: FullCreateProductDto) {
    const result = await this.typeormProductRepository.save(data);
    return result;
  }
}
