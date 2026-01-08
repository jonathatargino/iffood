import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';

@Module({
  exports: [ImagesService],
  providers: [ImagesService],
})
export class ImagesModule {}
