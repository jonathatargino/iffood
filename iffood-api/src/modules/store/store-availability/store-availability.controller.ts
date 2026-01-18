import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { StoreAvailabilityService } from './store-availability.service';
import { UpdateStoreAvailabilityDto } from './store-availability.dto';
import { UserId } from '../../../common/decorators/user-id';
import { AuthGuard } from '../../../common/guards/auth.guard';

@Controller('store/store-availability')
export class StoreAvailabilityController {
  constructor(
    private readonly storeAvailabilityService: StoreAvailabilityService,
  ) {}

  @Get(':storeId')
  findByStoreId(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.storeAvailabilityService.findByStoreId(storeId);
  }

  @Put('full')
  @UseGuards(AuthGuard)
  updateFullStoreAvailability(
    @Body() body: UpdateStoreAvailabilityDto,
    @UserId() userId: string,
  ) {
    return this.storeAvailabilityService.updateFullStoreAvailability({
      storeId: body.storeId,
      userId,
      availabilities: body.availabilities,
    });
  }
}
