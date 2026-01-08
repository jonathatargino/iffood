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

  @Get('me')
  @UseGuards(AuthGuard)
  async findMyStore(@UserId() userId: string) {
    return this.storeService.findByUserId(userId);
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
