import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreAvailability } from './store-availability.entity';

@Injectable()
export class StoreAvailabilityRepository {
  constructor(
    @InjectRepository(StoreAvailability)
    private readonly typeormStoreAvailabilityRepository: Repository<StoreAvailability>,
  ) {}

  findByStoreId(storeId: string) {
    return this.typeormStoreAvailabilityRepository.find({
      where: { store: { id: storeId } },
      relations: { store: true },
    });
  }
}
