import { Injectable, NotFoundException } from '@nestjs/common';
import { UserProfileRepository } from './user-profile.repository';

@Injectable()
export class UserProfileService {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async findById(id: string) {
    const result = await this.userProfileRepository.findById(id);

    if (!result) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return result;
  }

  updateWhatsappNumber(userId: string, whatsappNumber: string) {
    return this.userProfileRepository.updateWhatsappNumber(
      userId,
      whatsappNumber,
    );
  }
}
