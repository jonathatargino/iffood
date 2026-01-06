import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserProfile } from './user-profile.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private userRepository: Repository<UserProfile>,
  ) {}

  findAll(): Promise<UserProfile[]> {
    return this.userRepository.find({});
  }
}
