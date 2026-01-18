import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { StoreAvailabilityService } from './store-availability.service';
import { UpdateStoreAvailabilityDto } from './store-availability.dto';
import { UserId } from '../../../common/decorators/user-id';

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
