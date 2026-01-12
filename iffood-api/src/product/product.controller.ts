import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserId } from '../common/decorators/user-id';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(
    @Query('storeId') storeId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('name') name?: string,
  ) {
    return await this.productService.findAllByStoreId({
      page,
      pageSize,
      name,
      storeId,
    });
  }

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

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProduct(
    @Param('id') productId: string,
    @UserId() userId: string,
  ) {
    return await this.productService.delete({ productId, userId });
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async updateProduct(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @UploadedFile() photo: Express.Multer.File,
    @UserId() userId: string,
  ) {
    return await this.productService.updateProductWithOptions({
      id: id,
      description: body.description,
      name: body.name,
      productOptions: body.productOptions,
      value: body.value,
      photo,
      userId,
    });
  }
}
