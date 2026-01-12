import { Module } from '@nestjs/common';
import { UserProfileModule } from './user-profile/user-profile.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './store/store.module';
import { ProductsModule } from './product/product.module';
import { StoreUserModule } from './store-user/store-user.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DB_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),

    UserProfileModule,
    StoreModule,
    ProductsModule,
    StoreUserModule,
  ],
})
export class AppModule {}
