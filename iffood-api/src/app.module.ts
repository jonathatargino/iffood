import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StoreModule } from './modules/store/store.module';
import { ProductsModule } from './modules/product/product.module';
import { OrderRequestModule } from './modules/order-request/order-request.module';
import { ReviewModule } from './modules/review/review.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging-interceptor';
import { envSchema } from './config/schema';
import { GeneralExceptionsFilter } from './common/filters/general-exceptions.filter';
import { UserProfileModule } from './modules/user-profile/user-profile.module';
import { RedisModule } from './infra/redis/redis.module';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: GeneralExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: () => {
        return new ValidationPipe({
          whitelist: true,
          transform: true,
        });
      },
    },
  ],
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
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),
    EventEmitterModule.forRoot(),
    RedisModule,
    StoreModule,
    ProductsModule,
    OrderRequestModule,
    ReviewModule,
    UserProfileModule,
  ],
})
export class AppModule {}
