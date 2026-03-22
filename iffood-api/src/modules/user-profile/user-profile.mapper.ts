import { Injectable } from '@nestjs/common';
import { UserProfile } from './user-profile.entity';
import { UserProfileCoreResponseDto } from './dto/user-profile.core.dto';

@Injectable()
export class UserProfileBaseMapper {
  constructor() {}

  toDto(userProfile: UserProfile): UserProfileCoreResponseDto {
    return {
      email: userProfile.email,
      name: userProfile.name,
      whatsapp: userProfile.whatsapp,
      id: userProfile.id,
      photoUrl: userProfile.photoUrl,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
    };
  }
}
