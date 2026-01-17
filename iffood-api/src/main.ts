import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  await app.listen(process.env.PORT ?? 3006, '0.0.0.0');
}

bootstrap().catch((error) => {
  console.log(error);
  process.exit(1);
});
