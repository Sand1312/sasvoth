import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { NestPinoLogger } from './common/logger';
import { AppModule } from './app.module';

async function bootstrap() {
  const appLogger = new NestPinoLogger();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: appLogger,
  });

  app.useLogger(appLogger);

  app.use(cookieParser());

  app.enableCors({
    origin:  'http://localhost:3002',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  });

  // Add API version prefix so all controllers are served under /api/v1
  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SASVoth API')
    .setDescription('API documentation for SASVoth services')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  // Serve Swagger UI under /api/v1/docs
  SwaggerModule.setup('api/v1/docs', app, swaggerDocument);

  const port = Number(process.env.PORT) || 8000;
  await app.listen(port);

  appLogger.log(`API listening on port ${port}`, 'Bootstrap');
}

bootstrap();
