import { Module } from '@nestjs/common';
import { StoreUserModule } from '../store/store-user/store-user.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ImagesModule } from '../../infra/images/images.module';
import { AuthModule } from '../auth/auth.module';
import { ProductMapper } from './product.mapper';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, ProductMapper],
  imports: [
    TypeOrmModule.forFeature([Product]),
    ImagesModule,
    StoreUserModule,
    AuthModule,
  ],
  exports: [],
})
export class ProductsModule {}
