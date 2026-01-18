import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { logger } from '../../common/logger';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesService {
  private s3Client: S3Client;
  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client();
  }

  async upload({
    fileBuffer,
    mimeType,
  }: {
    fileBuffer: Buffer;
    mimeType: string;
  }) {
    const { v4: uuidv4 } = await import('uuid');

    const generatedUUID = uuidv4();

    const command = new PutObjectCommand({
      Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
      Key: generatedUUID,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      logger.error(error);
      throw new InternalServerErrorException();
    }

    return `https://${this.configService.getOrThrow('AWS_BUCKET_NAME')}.s3.${this.configService.getOrThrow('AWS_REGION')}.amazonaws.com/${generatedUUID}`;
  }
}
