import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
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
}
