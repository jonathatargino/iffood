import { Module } from '@nestjs/common';
import { UserProfileModule } from './user-profile/user-profile.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './store/store.module';
import { FilesModule } from './files/files.module';

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
    FilesModule,
  ],
})
export class AppModule {}
