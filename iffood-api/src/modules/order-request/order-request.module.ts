import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderRequest } from './order-request.entity';
import { OrderRequestController } from './order-request.controller';
import { OrderRequestService } from './order-request.service';
import { OrderRequestRepository } from './order-request.repository';
import { OrderRequestMapper } from './order-request.mapper';
import { OrderRequestItemMapper } from './order-request-item/order-request-item.mapper';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([OrderRequest]), AuthModule],
  controllers: [OrderRequestController],
  providers: [
    OrderRequestService,
    OrderRequestRepository,
    OrderRequestMapper,
    OrderRequestItemMapper,
  ],
})
export class OrderRequestModule {}
