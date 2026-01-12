import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateStoreDto } from './store.dto';
import { StoreService } from './store.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserId } from '../common/decorators/user-id';

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
  ) {
    return this.storeService.findAll({ name, pageSize, page });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async findMyStore(@UserId() userId: string) {
    return this.storeService.findByUserId(userId);
  }

  @Get(':id')
  async findById(@Param('id') storeId: string) {
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
    try {
      const result = await this.storeService.create({
        description: body.description,
        name: body.name,
        whatsapp: body.whatsapp,
        photo,
        userId,
      });

      return result;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@UserId() userId: string, @Param('id') storeId: string) {
    try {
      await this.storeService.delete({ userId, storeId });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(
    @Body() body: CreateStoreDto,
    @UserId() userId: string,
    @Param('id') storeId: string,
  ) {
    await this.storeService.update({
      description: body.description,
      name: body.name,
      whatsapp: body.whatsapp,
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
    @Param('id') storeId: string,
  ) {
    await this.storeService.updatePhoto({
      photo,
      storeId,
      userId,
    });
  }
}
