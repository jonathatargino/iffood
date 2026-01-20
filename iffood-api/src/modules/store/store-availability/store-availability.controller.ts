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
import { UpdateStoreAvailabilityRequestDto } from './dto/store-availability.request.dto';
import { UserId } from '../../../common/decorators/user-id';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { StoreAvailabilityMapper } from './store-availability.mapper';
import { ApiOkResponse } from '@nestjs/swagger';
import {
  ListStoreAvailabilityResponseDto,
  ListStoreAvailabilityWithStoreIdResponseDto,
} from './dto/store-availability.response.dto';

@Controller('store/store-availability')
export class StoreAvailabilityController {
  constructor(
    private readonly storeAvailabilityService: StoreAvailabilityService,
    private readonly storeAvailabilityMapper: StoreAvailabilityMapper,
  ) {}

  @ApiOkResponse({ type: ListStoreAvailabilityResponseDto })
  @Get(':storeId')
  async findByStoreId(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.storeAvailabilityMapper.toListDto(
      await this.storeAvailabilityService.findByStoreId(storeId),
    );
  }

  @ApiOkResponse({ type: ListStoreAvailabilityWithStoreIdResponseDto })
  @Put('full')
  @UseGuards(AuthGuard)
  async updateFullStoreAvailability(
    @Body() body: UpdateStoreAvailabilityRequestDto,
    @UserId() userId: string,
  ) {
    return this.storeAvailabilityMapper.toListDtoWithStoreId(
      await this.storeAvailabilityService.updateFullStoreAvailability({
        storeId: body.storeId,
        userId,
        availabilities: body.availabilities,
      }),
    );
  }
}
