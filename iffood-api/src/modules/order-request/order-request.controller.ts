import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UserId } from '../../common/decorators/user-id';
import { OrderRequestService } from './order-request.service';
import { OrderRequestMapper } from './order-request.mapper';
import {
  CreateOrderRequestDto,
  ChangeAndConcludeRequestDto,
  FindOrdersByStoreQueryDto,
} from './dto/order-request.request.dto';
import {
  CreateOrderResponseDto,
  OrderRequestResponseDto,
} from './dto/order-request.response.dto';
import { SqsService } from '../../infra/sqs/sqs.service';

@Controller('order-request')
export class OrderRequestController {
  constructor(
    private readonly orderRequestService: OrderRequestService,
    private readonly orderRequestMapper: OrderRequestMapper,
    private readonly sqsService: SqsService,
  ) {}

  @ApiBearerAuth('access-token')
  @ApiResponse({ type: CreateOrderResponseDto })
  @Post()
  @UseGuards(AuthGuard)
  async createOrder(
    @Body() body: CreateOrderRequestDto,
    @UserId() userId: string,
  ) {
    const result = await this.orderRequestService.createOrder({
      cartId: body.cartId,
      storeId: body.storeId,
      items: body.items,
      userId,
    });

    return this.orderRequestMapper.toCreateResponseDto(
      result.order.id,
      result.whatsappUrl,
    );
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({ type: CreateOrderResponseDto })
  @Post('no-lock')
  @UseGuards(AuthGuard)
  async createOrderNoLock(
    @Body() body: CreateOrderRequestDto,
    @UserId() userId: string,
  ) {
    const result = await this.orderRequestService.createOrderNoLock({
      cartId: body.cartId,
      storeId: body.storeId,
      items: body.items,
      userId,
    });

    return this.orderRequestMapper.toCreateResponseDto(
      result.order.id,
      result.whatsappUrl,
    );
  }

  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 202, description: 'Pedido enfileirado para processamento assíncrono' })
  @Post('async')
  @HttpCode(202)
  @UseGuards(AuthGuard)
  async createOrderAsync(
    @Body() body: CreateOrderRequestDto,
    @UserId() userId: string,
  ) {
    await this.sqsService.sendMessage({
      cartId: body.cartId,
      storeId: body.storeId,
      items: body.items,
      userId,
    });
    return { status: 'processing' };
  }

  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: [OrderRequestResponseDto] })
  @Get()
  @UseGuards(AuthGuard)
  async findByStoreId(
    @Query() { storeId }: FindOrdersByStoreQueryDto,
    @UserId() userId: string,
  ) {
    const orders = await this.orderRequestService.findByStoreId(
      storeId,
      userId,
    );
    return this.orderRequestMapper.toListDto(orders);
  }

  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: OrderRequestResponseDto })
  @Get(':id')
  @UseGuards(AuthGuard)
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.orderRequestService.findById(id);
    return this.orderRequestMapper.toDto(order);
  }

  @ApiBearerAuth('access-token')
  @Patch(':id/conclude')
  @UseGuards(AuthGuard)
  async conclude(
    @Param('id', ParseUUIDPipe) id: string,
    @UserId() userId: string,
  ) {
    await this.orderRequestService.conclude({
      orderRequestId: id,
      userId,
    });
  }

  @ApiBearerAuth('access-token')
  @Patch(':id/reject')
  @UseGuards(AuthGuard)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @UserId() userId: string,
  ) {
    await this.orderRequestService.reject({
      orderRequestId: id,
      userId,
    });
  }

  @ApiBearerAuth('access-token')
  @Patch(':id/change-and-conclude')
  @UseGuards(AuthGuard)
  async changeAndConclude(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeAndConcludeRequestDto,
    @UserId() userId: string,
  ) {
    await this.orderRequestService.changeAndConclude({
      orderRequestId: id,
      items: body.items,
      userId,
    });
  }
}
