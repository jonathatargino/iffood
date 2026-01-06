import { Module } from '@nestjs/common';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './user-profile.entity';

@Module({
  controllers: [UserProfileController],
  exports: [],
  imports: [TypeOrmModule.forFeature([UserProfile])],
  providers: [UserProfileService],
})
export class UserProfileModule {}
