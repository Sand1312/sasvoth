import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';

async function bootstrap() {
  await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'], 
  })
    .then(app => app.listen(8000))
    .catch(err => console.error('Failed to start app:', err));
}
bootstrap();