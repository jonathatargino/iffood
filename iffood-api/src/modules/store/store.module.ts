import { StoreController } from './store.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreRepository } from './store.repository';
import { StoreAvailabilityModule } from './store-availability/store-availability.module';
import { ImagesModule } from '../../infra/images/images.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store]),
    ImagesModule,
    StoreAvailabilityModule,
  ],
  controllers: [StoreController],
  providers: [StoreService, StoreRepository],
  exports: [StoreAvailabilityModule],
})
export class StoreModule {}
