import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserId } from '../common/decorators/user-id';
import { CreateProductDto } from './product.dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createProduct(
    @Body() body: CreateProductDto,
    @UploadedFile() photo: Express.Multer.File,
    @UserId() userId: string,
  ) {
    return await this.productService.createProductWithOptions({
      ...body,
      photo,
      userId,
    });
  }
}
