import { Module } from '@nestjs/common';
import { UserProfileController } from './user-profile.controller';
import { UserProfileBaseMapper } from './user-profile.mapper';
import { UserProfileService } from './user-profile.service';
import { UserProfileRepository } from './user-profile.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile])],
  controllers: [UserProfileController],
  providers: [UserProfileRepository, UserProfileBaseMapper, UserProfileService],
})
export class UserProfileModule {}
