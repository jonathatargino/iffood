import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UserId } from '../../common/decorators/user-id';
import {
  CreateProductRequestBodyDto,
  UpdateProductRequestBodyDto,
} from './dto/product.request.dto';
import { ProductService } from './product.service';
import { ProductCategory } from './product.entity';
import { ProductMapper } from './product.mapper';
import { ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import {
  ProductDetailsResponseDto,
  ProductListResponseDto,
} from './dto/product.response.dto';

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productMapper: ProductMapper,
  ) {}

  @ApiOkResponse({ type: [ProductListResponseDto] })
  @Get()
  async findAll(
    @Query('storeId') storeId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('name') name?: string,
    @Query('category') category?: ProductCategory,
    @Query('weekday') weekday?: string,
    @Query('hours') hours?: string,
  ) {
    return this.productMapper.toListDto(
      await this.productService.findAllByStoreId({
        page,
        pageSize,
        name,
        storeId,
        category,
        weekday: weekday ? parseInt(weekday, 10) : undefined,
        hours,
      }),
    );
  }

  @Get('dashboard')
  async findAllWithTotalCountByStoreId(@Query('storeId') storeId: string) {
    return await this.productService.findAllWithTotalCountByStoreId({
      storeId,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createProduct(
    @Body() body: CreateProductRequestBodyDto,
    @UploadedFile() photo: Express.Multer.File,
    @UserId() userId: string,
  ) {
    return await this.productService.createProductWithOptions({
      ...body,
      photoBuffer: photo.buffer,
      userId,
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProduct(
    @Param('id', ParseUUIDPipe) productId: string,
    @UserId() userId: string,
  ) {
    return await this.productService.delete({ productId, userId });
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProductRequestBodyDto,
    @UploadedFile() photo: Express.Multer.File,
    @UserId() userId: string,
  ) {
    return await this.productService.updateProductWithOptions({
      id: id,
      description: body.description,
      name: body.name,
      productOptions: body.productOptions,
      value: body.value,
      photoBuffer: photo.buffer,
      userId,
      category: body.category,
    });
  }

  @ApiResponse({ type: ProductDetailsResponseDto })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) productId: string) {
    return this.productMapper.toDetailsDto(
      await this.productService.findById({ productId }),
    );
  }
}
