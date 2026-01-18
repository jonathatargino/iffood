import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateStoreDto, UpdateStoreDto } from './store.dto';
import { StoreService } from './store.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UserId } from '../../common/decorators/user-id';

@Controller({
  path: 'store',
})
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Get()
  async findAll(
    @Query('name') name?: string,
    @Query('pageSize') pageSize: number = 20,
    @Query('page') page: number = 1,
    @Query('weekday') weekday?: string,
    @Query('hours') hours?: string,
  ) {
    return this.storeService.findAll({
      name,
      pageSize,
      page,
      weekday: weekday !== undefined ? Number(weekday) : undefined,
      hours,
    });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async findMyStore(@UserId() userId: string) {
    return this.storeService.findByUserId(userId);
  }

  @Get('available')
  async findThereIsAvailableStore(
    @Query('weekday', ParseIntPipe) weekday: number,
    @Query('hours') hours: string,
  ) {
    return this.storeService.findThereIsAvailableStore({
      weekday,
      hours,
    });
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) storeId: string) {
    const store = await this.storeService.findById(storeId);
    return store;
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() body: CreateStoreDto,
    @UploadedFile() photo: Express.Multer.File,
    @UserId() userId: string,
  ) {
    return await this.storeService.create({
      description: body.description,
      name: body.name,
      whatsapp: body.whatsapp,
      photoBuffer: photo.buffer,
      userId,
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) storeId: string,
  ) {
    return await this.storeService.delete({ userId, storeId });
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(
    @Body() body: UpdateStoreDto,
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) storeId: string,
  ) {
    await this.storeService.update({
      description: body.description,
      name: body.name,
      whatsapp: body.whatsapp,
      status: body.status,
      storeId,
      userId,
    });
  }

  @Patch(':id/photo')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async updatePhoto(
    @UploadedFile() photo: Express.Multer.File,
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) storeId: string,
  ) {
    await this.storeService.updatePhoto({
      photo,
      storeId,
      userId,
    });
  }
}
