import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'], // Ok, log levels
  });
  
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());
  
  app.enableCors({
    origin: 'http://localhost:3000', // FE origin
    credentials: true, // FIX: Sửa 'credential' thành 'credentials' để gửi cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // FIX: 'method' thành 'methods'
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'], // Thêm để FE axios mượt
  });
  
  await app.listen(8000); // Port backend
}
bootstrap();