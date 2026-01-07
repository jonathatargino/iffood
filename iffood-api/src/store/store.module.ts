import { StoreController } from './store.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { FilesService } from '../files/files.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  controllers: [StoreController],
  providers: [StoreService, FilesService],
})
export class StoreModule {}
