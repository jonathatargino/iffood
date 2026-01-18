import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors();
  await app.listen(config.getOrThrow('PORT'), '0.0.0.0');
}

bootstrap().catch((error) => {
  console.log(error);
  process.exit(1);
});
