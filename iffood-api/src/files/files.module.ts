import { Module } from '@nestjs/common';
import { FilesService } from './files.service';

@Module({
  imports: [],
  controllers: [],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
