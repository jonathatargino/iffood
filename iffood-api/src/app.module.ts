import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './modules/store/store.module';
import { ProductsModule } from './modules/product/product.module';
import { StoreUserModule } from './modules/store-user/store-user.module';
import { StoreAvailabilityModule } from './modules/store/store-availability/store-availability.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DB_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),

    StoreAvailabilityModule,
    StoreModule,
    ProductsModule,
    StoreUserModule,
  ],
})
export class AppModule {}
