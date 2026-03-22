import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UserId } from '../../common/decorators/user-id';
import { UpdateWhatsappRequestDto } from './dto/user-profile.request.dto';
import { UserProfileBaseMapper } from './user-profile.mapper';

@Controller('user-profile')
export class UserProfileController {
  constructor(
    readonly userProfileService: UserProfileService,
    readonly userProfileBaseMapper: UserProfileBaseMapper,
  ) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async findMe(@UserId() userId: string) {
    const result = await this.userProfileService.findById(userId);
    return this.userProfileBaseMapper.toDto(result);
  }

  @UseGuards(AuthGuard)
  @Patch('/me/whatsapp')
  async updateMyWhatsapp(
    @UserId() userId: string,
    @Body() updateWhatsappRequestDto: UpdateWhatsappRequestDto,
  ) {
    const result = await this.userProfileService.updateWhatsappNumber(
      userId,
      updateWhatsappRequestDto.whatsapp,
    );
    return this.userProfileBaseMapper.toDto(result);
  }
}
