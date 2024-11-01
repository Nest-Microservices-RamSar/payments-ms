import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { envs } from './config';

async function bootstrap() {
  const logger = new Logger('Payments-MS');

  const app = await NestFactory.create(AppModule);
  await app.listen(envs.PORT);

  logger.log(`Payments MS is running on port: ${envs.PORT}`);
}
bootstrap();
