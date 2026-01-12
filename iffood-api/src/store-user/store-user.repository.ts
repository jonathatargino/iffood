import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreUser } from './store-user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StoreUserRepository {
  constructor(
    @InjectRepository(StoreUser)
    private readonly typeormStoreUserRepository: Repository<StoreUser>,
  ) {}

  async findByUserProfileIdAndStoreId({
    storeId,
    userProfileId,
  }: {
    userProfileId: string;
    storeId: string;
  }) {
    const result = await this.typeormStoreUserRepository.findOne({
      where: {
        store: { id: storeId },
        userProfile: { id: userProfileId },
      },
    });

    return result;
  }
}
