import { NestFactory } from '@nestjs/core';
import { OrderRequestWorkerModule } from './order-request-worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    OrderRequestWorkerModule,
  );
  app.enableShutdownHooks();
}

bootstrap().catch((error) => {
  console.error('Erro ao iniciar worker:', error);
  process.exit(1);
});
