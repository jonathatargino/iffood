import { Injectable } from '@nestjs/common';
import { StoreUserRepository } from './store-user.repository';

@Injectable()
export class StoreUserService {
  constructor(private readonly storeUserRepository: StoreUserRepository) {}

  async isUserStoreMember({
    userProfileId,
    storeId,
  }: {
    userProfileId: string;
    storeId: string;
  }): Promise<boolean> {
    const storeUser =
      await this.storeUserRepository.findByUserProfileIdAndStoreId({
        userProfileId,
        storeId,
      });

    return !!storeUser;
  }
}
