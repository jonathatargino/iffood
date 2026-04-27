import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { envSchema } from '../config/schema';
import { OrderRequestModule } from '../modules/order-request/order-request.module';
import { SqsModule } from '../infra/sqs/sqs.module';
import { OrderRequestConsumerService } from './order-request-consumer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.getOrThrow('DB_TYPE'),
        url: configService.getOrThrow('DB_URL'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),
    EventEmitterModule.forRoot(),
    SqsModule,
    OrderRequestModule,
  ],
  providers: [OrderRequestConsumerService],
})
export class OrderRequestWorkerModule {}
