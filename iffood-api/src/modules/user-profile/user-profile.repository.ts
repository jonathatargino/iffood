import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserProfile } from './user-profile.entity';
import { Repository } from 'typeorm';
import { FindMeResponseDto } from './dto/user-profile.response.dto';
import { ApiOkResponse } from '@nestjs/swagger';

@Injectable()
export class UserProfileRepository {
  constructor(
    @InjectRepository(UserProfile)
    private readonly typeormUserProfileRepository: Repository<UserProfile>,
  ) {}

  @ApiOkResponse({ type: FindMeResponseDto })
  async findById(id: string) {
    return this.typeormUserProfileRepository.findOne({
      where: { id },
    });
  }

  @ApiOkResponse({ type: FindMeResponseDto })
  async updateWhatsappNumber(userId: string, whatsappNumber: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    user.setWhatsapp(whatsappNumber);
    await this.typeormUserProfileRepository.save(user);

    return user;
  }
}
