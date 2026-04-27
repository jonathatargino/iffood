import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class SqsService {
  private readonly sqs: AWS.SQS;
  private readonly queueUrl: string;
  private readonly logger = new Logger(SqsService.name);

  constructor(private readonly configService: ConfigService) {
    const isLocal = this.configService.get('NODE_ENV') !== 'production';

    this.sqs = new AWS.SQS({
      region: isLocal ? 'us-east-1' : this.configService.getOrThrow('AWS_REGION'),
      ...(isLocal && {
        endpoint: 'http://localhost:4566',
        accessKeyId: 'test',
        secretAccessKey: 'test',
      }),
    });

    this.queueUrl = this.configService.getOrThrow('SQS_QUEUE_URL');
  }

  async sendMessage(body: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Enviando mensagem para ${this.queueUrl}`);
    await this.sqs
      .sendMessage({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(body),
      })
      .promise();
  }

  async receiveMessages(maxMessages = 10): Promise<AWS.SQS.Message[]> {
    const result = await this.sqs
      .receiveMessage({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: 20,
      })
      .promise();
    return result.Messages ?? [];
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    await this.sqs
      .deleteMessage({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      })
      .promise();
  }
}
