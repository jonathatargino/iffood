import { StoreController } from './store.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { ImagesModule } from '../images/images.module';
import { StoreRepository } from './store.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Store]), ImagesModule],
  controllers: [StoreController],
  providers: [StoreService, StoreRepository],
})
export class StoreModule {}
