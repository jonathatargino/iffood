import { Controller, Get } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';

@Controller({
  path: 'user',
})
export class UserProfileController {
  constructor(private userService: UserProfileService) {}

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }
}
