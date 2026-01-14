import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { FilesService } from '../files/files.service';

@Injectable()
export class ImagesService {
  constructor(private readonly fileService: FilesService) {}

  async upload(imageBuffer: Buffer) {
    await this.validate(imageBuffer);
    const processedPhoto = await this.process(imageBuffer);

    return await this.fileService.upload({
      fileBuffer: processedPhoto,
      mimeType: 'image/webp',
    });
  }

  async validate(imageBuffer: Buffer): Promise<void> {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('Invalid image file');
    }

    if (metadata.width < 800 || metadata.height < 600) {
      throw new BadRequestException(
        'Image dimensions are too small. Minimum size is 800x600 pixels.',
      );
    }

    if (metadata.width > 5000 || metadata.height > 5000) {
      throw new BadRequestException(
        'Image dimensions are too large. Maximum size is 5000x5000 pixels.',
      );
    }
  }

  async process(imageBuffer: Buffer): Promise<Buffer> {
    const processedImage = await sharp(imageBuffer)
      .rotate()
      .resize(1080, 1080, { fit: 'cover' })
      .webp({ quality: 75 })
      .toBuffer();

    return processedImage;
  }
}
