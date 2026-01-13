import { Module } from '@nestjs/common';
import { StoreAvailabilityRepository } from './store-availability.repository';
import { StoreAvailabilityController } from './store-availability.controller';
import { StoreAvailabilityService } from './store-availability.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreAvailability } from './store-availability.entity';

@Module({
  controllers: [StoreAvailabilityController],
  providers: [StoreAvailabilityService, StoreAvailabilityRepository],
  imports: [TypeOrmModule.forFeature([StoreAvailability])],
  exports: [],
})
export class StoreAvailabilityModule {}
