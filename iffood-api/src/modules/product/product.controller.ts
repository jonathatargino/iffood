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
  FindAllProductQueryDto,
  ProductDashboardQueryDto,
  SwaggerCreateProductRequestBodyDto,
  SwaggerUpdateProductRequestBodyDto,
  UpdateProductRequestBodyDto,
} from './dto/product.request.dto';
import { ProductService } from './product.service';
import { ProductMapper } from './product.mapper';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import {
  ProductDashboardResponseDto,
  ProductDetailsResponseDto,
  ProductListResponseDto,
  SingleProductResponseDto,
  SingleProductWithStoreResponseDto,
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
    @Query()
    {
      page,
      pageSize,
      category,
      hours,
      name,
      storeId,
      weekday,
    }: FindAllProductQueryDto,
  ) {
    return this.productMapper.toListDto(
      await this.productService.findAllByStoreId({
        page,
        pageSize,
        name,
        storeId,
        category,
        weekday: weekday,
        hours,
      }),
    );
  }

  @ApiResponse({ type: ProductDetailsResponseDto })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) productId: string) {
    return this.productMapper.toDetailsDto(
      await this.productService.findById({ productId }),
    );
  }

  @ApiOkResponse({ type: [ProductDashboardResponseDto] })
  @Get('dashboard')
  async findAllWithTotalCountByStoreId(
    @Query() { storeId }: ProductDashboardQueryDto,
  ) {
    return this.productMapper.toDashboardDto(
      await this.productService.findAllWithTotalCountByStoreId({
        storeId,
      }),
    );
  }

  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: SingleProductWithStoreResponseDto })
  @ApiBody({ type: SwaggerCreateProductRequestBodyDto })
  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createProduct(
    @Body() body: CreateProductRequestBodyDto,
    @UploadedFile() photo: Express.Multer.File,
    @UserId() userId: string,
  ) {
    return this.productMapper.toWithStoreDto(
      await this.productService.createProductWithOptions({
        ...body,
        photoBuffer: photo.buffer,
        userId,
      }),
    );
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SwaggerUpdateProductRequestBodyDto })
  @ApiOkResponse({ type: SingleProductResponseDto })
  @Put(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProductRequestBodyDto,
    @UploadedFile() photo: Express.Multer.File,
    @UserId() userId: string,
  ) {
    return this.productMapper.toDto(
      await this.productService.updateProductWithOptions({
        id: id,
        description: body.description,
        name: body.name,
        productOptions: body.productOptions,
        value: body.value,
        photoBuffer: photo.buffer,
        userId,
        category: body.category,
      }),
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProduct(
    @Param('id', ParseUUIDPipe) productId: string,
    @UserId() userId: string,
  ) {
    await this.productService.delete({ productId, userId });
  }
}
