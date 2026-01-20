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
import { StoreService } from './store.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UserId } from '../../common/decorators/user-id';
import {
  CreateStoreRequestDto,
  FindAllStoresQueryDto,
  SwaggerCreateStoreRequestDto,
  SwaggerUpdateStoreRequestDto,
  UpdateStoreRequestDto,
} from './dto/store.request.dto';
import { StoreMapper } from './store.mapper';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  BaseStoreResponseDto,
  IsAvailableStoreResponseDto,
  PaginatedStoresResponseDto,
  StoreWithProductsResponseDto,
} from './dto/store.response.dto';
import { StoreBaseMapper } from './store.base.mapper';

@Controller({
  path: 'store',
})
export class StoreController {
  constructor(
    private storeService: StoreService,
    private storeMapper: StoreMapper,
    private storeBaseMapper: StoreBaseMapper,
  ) {}

  @ApiOkResponse({ type: PaginatedStoresResponseDto })
  @Get()
  async findAll(
    @Query() { page, pageSize, hours, name, weekday }: FindAllStoresQueryDto,
  ) {
    return this.storeMapper.toPaginatedDto(
      await this.storeService.findAll({
        name,
        pageSize,
        page,
        weekday,
        hours,
      }),
    );
  }

  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(BaseStoreResponseDto) },
    },
  })
  @Get('me')
  @UseGuards(AuthGuard)
  async findMyStore(@UserId() userId: string) {
    return this.storeBaseMapper.toListDto(
      await this.storeService.findByUserId(userId),
    );
  }

  @ApiOkResponse({ type: IsAvailableStoreResponseDto })
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

  @ApiOkResponse({ type: StoreWithProductsResponseDto })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) storeId: string) {
    return this.storeMapper.toDtoWithProducts(
      await this.storeService.findById(storeId),
    );
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SwaggerCreateStoreRequestDto })
  @ApiOkResponse({ type: BaseStoreResponseDto })
  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() body: CreateStoreRequestDto,
    @UploadedFile() photo: Express.Multer.File,
    @UserId() userId: string,
  ) {
    return this.storeBaseMapper.toDto(
      await this.storeService.create({
        description: body.description,
        name: body.name,
        whatsapp: body.whatsapp,
        photoBuffer: photo.buffer,
        userId,
      }),
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) storeId: string,
  ) {
    return await this.storeService.delete({ userId, storeId });
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SwaggerUpdateStoreRequestDto })
  @Put(':id')
  @UseGuards(AuthGuard)
  async update(
    @Body() body: UpdateStoreRequestDto,
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
