import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

/** URL da fila aponta para LocalStack / dev (porta 4566, docker host, etc.) */
function queueUrlLooksLikeLocalStack(queueUrl: string): boolean {
  return /:(4566)\b|localhost|127\.0\.0\.1|host\.docker\.internal|localstack\b/.test(
    queueUrl,
  );
}

@Injectable()
export class SqsService {
  private readonly sqs: AWS.SQS;
  private readonly queueUrl: string;
  private readonly logger = new Logger(SqsService.name);

  constructor(private readonly configService: ConfigService) {
    this.queueUrl = this.configService.getOrThrow('SQS_QUEUE_URL');

    const isDev = this.configService.get('NODE_ENV') !== 'production';
    const explicitEndpoint = this.configService.get<string>('SQS_ENDPOINT');
    const queueLocal = queueUrlLooksLikeLocalStack(this.queueUrl);
    const queueIsAwsHosted = this.queueUrl.includes('amazonaws.com');

    const useLocalStack =
      Boolean(explicitEndpoint) ||
      queueLocal ||
      (isDev && !queueIsAwsHosted);

    let endpoint =
      explicitEndpoint ??
      (queueLocal ? new URL(this.queueUrl).origin : undefined);
    if (useLocalStack && !endpoint && isDev && !queueIsAwsHosted) {
      endpoint = 'http://localhost:4566';
    }

    this.sqs = new AWS.SQS({
      region: useLocalStack ? 'us-east-1' : this.configService.getOrThrow('AWS_REGION'),
      ...(useLocalStack &&
        endpoint && {
          endpoint,
          accessKeyId: 'test',
          secretAccessKey: 'test',
        }),
    });
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
