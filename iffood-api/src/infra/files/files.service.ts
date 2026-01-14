import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { logger } from '../../common/logger';

@Injectable()
export class FilesService {
  private s3Client: S3Client;
  constructor() {
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
      Bucket: process.env.AWS_BUCKET_NAME,
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

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${generatedUUID}`;
  }
}
