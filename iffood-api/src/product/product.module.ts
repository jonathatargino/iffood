import { Module } from '@nestjs/common';
import { ProductsOptionModule } from '../product-option/product-option.module';
import { ImagesModule } from '../images/images.module';
import { StoreUserModule } from '../store-user/store-user.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  imports: [
    TypeOrmModule.forFeature([Product]),
    ProductsOptionModule,
    ImagesModule,
    StoreUserModule,
  ],
  exports: [],
})
export class ProductsModule {}
