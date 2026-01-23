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
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import {
  ProductDashboardResponseDto,
  ProductDetailsResponseDto,
  PaginatedProductListResponseDto,
  SingleProductResponseDto,
  SingleProductWithBaseStoreResponseDto,
} from './dto/product.response.dto';

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productMapper: ProductMapper,
  ) {}

  @ApiOkResponse({ type: PaginatedProductListResponseDto })
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
      await this.productService.findAll({
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

  @ApiResponse({ type: ProductDetailsResponseDto })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) productId: string) {
    return this.productMapper.toDetailsDto(
      await this.productService.findById({ productId }),
    );
  }

  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: SingleProductWithBaseStoreResponseDto })
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

  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SwaggerUpdateProductRequestBodyDto })
  @ApiOkResponse({ type: SingleProductResponseDto })
  @Put(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProductRequestBodyDto,
    @UserId() userId: string,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.productMapper.toDto(
      await this.productService.updateProductWithOptions({
        id: id,
        description: body.description,
        name: body.name,
        productOptions: body.productOptions,
        value: body.value,
        photoBuffer: photo?.buffer,
        userId,
        category: body.category,
      }),
    );
  }

  @ApiBearerAuth('access-token')
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProduct(
    @Param('id', ParseUUIDPipe) productId: string,
    @UserId() userId: string,
  ) {
    await this.productService.delete({ productId, userId });
  }
}
