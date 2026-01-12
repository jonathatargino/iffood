import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreUserService } from './store-user.service';
import { StoreUserRepository } from './store-user.repository';
import { StoreUser } from './store-user.entity';

@Module({
  controllers: [],
  providers: [StoreUserRepository, StoreUserService],
  imports: [TypeOrmModule.forFeature([StoreUser])],
  exports: [StoreUserService],
})
export class StoreUserModule {}
