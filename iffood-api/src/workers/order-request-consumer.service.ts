import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SqsService } from '../infra/sqs/sqs.service';
import { OrderRequestService } from '../modules/order-request/order-request.service';
import { ServiceCreateOrderDto } from '../modules/order-request/dto/order-request.service.dto';

interface OrderRequestMessage {
  cartId: string;
  storeId: string;
  userId: string;
  items: {
    productId: string;
    productOptionId: string;
    quantity: number;
  }[];
}

@Injectable()
export class OrderRequestConsumerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrderRequestConsumerService.name);
  private running = false;

  constructor(
    private readonly sqsService: SqsService,
    private readonly orderRequestService: OrderRequestService,
  ) {}

  onApplicationBootstrap() {
    this.running = true;
    this.logger.log('Worker iniciado — polling da fila SQS...');
    void this.poll();
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        await this.processNextBatch();
      } catch (err) {
        this.logger.error('Erro no ciclo de polling', err);
        await this.sleep(5000);
      }
    }
  }

  private async processNextBatch(): Promise<void> {
    const messages = await this.sqsService.receiveMessages(10);

    if (messages.length === 0) {
      return;
    }

    this.logger.debug(`Recebidas ${messages.length} mensagens`);

    await Promise.allSettled(
      messages.map((message) => this.processMessage(message)),
    );
  }

  private async processMessage(
    message: import('aws-sdk').SQS.Message,
  ): Promise<void> {
    const receiptHandle = message.ReceiptHandle!;
    const startTime = Date.now();

    let parsed: OrderRequestMessage;
    try {
      parsed = JSON.parse(message.Body!) as OrderRequestMessage;
    } catch {
      this.logger.error(
        `Mensagem inválida (não é JSON): ${message.MessageId}`,
      );
      await this.sqsService.deleteMessage(receiptHandle);
      return;
    }

    const dto: ServiceCreateOrderDto = {
      cartId: parsed.cartId,
      storeId: parsed.storeId,
      userId: parsed.userId,
      items: parsed.items,
    };

    try {
      await this.orderRequestService.createOrder(dto);
      const elapsed = Date.now() - startTime;
      this.logger.log(
        `Pedido processado com sucesso | cartId=${parsed.cartId} | elapsed=${elapsed}ms`,
      );
      await this.sqsService.deleteMessage(receiptHandle);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      this.logger.error(
        `Falha ao processar pedido | cartId=${parsed.cartId} | elapsed=${elapsed}ms`,
        err,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
