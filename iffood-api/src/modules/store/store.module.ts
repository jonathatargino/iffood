import { StoreController } from './store.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreRepository } from './store.repository';
import { StoreAvailabilityModule } from './store-availability/store-availability.module';
import { ImagesModule } from '../../infra/images/images.module';
import { StoreUserModule } from './store-user/store-user.module';
import { AuthModule } from '../auth/auth.module';
import { StoreMapper } from './store.mapper';
import { ProductBaseMapper } from '../product/product.base.mapper';
import { StoreBaseMapper } from './store.base.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store]),
    ImagesModule,
    StoreAvailabilityModule,
    StoreUserModule,
    AuthModule,
  ],
  controllers: [StoreController],
  providers: [
    StoreService,
    StoreRepository,
    StoreMapper,
    StoreBaseMapper,
    ProductBaseMapper,
  ],
  exports: [StoreAvailabilityModule, StoreUserModule],
})
export class StoreModule {}
