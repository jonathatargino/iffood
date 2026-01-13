import { Module } from '@nestjs/common';
import { StoreUserModule } from '../store-user/store-user.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ImagesModule } from '../../infra/images/images.module';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  imports: [TypeOrmModule.forFeature([Product]), ImagesModule, StoreUserModule],
  exports: [],
})
export class ProductsModule {}
