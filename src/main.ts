import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration for frontend -> API calls
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:4000',
      'http://103.200.23.65:3000', // dev/local FE
      'http://103.200.23.65:4000', // dev/local FE
      'http://kimloaitamthienloc.vn', // production FE
      'http://www.kimloaitamthienloc.vn',
      'https://kimloaitamthienloc.vn', // production FE
      'https://www.kimloaitamthienloc.vn',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Swagger configuration
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Do Gia Dung API')
      .setDescription('API documentation for Do Gia Dung application')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer('/')
      .addServer(`http://localhost:${process.env.PORT ?? 8080}`)
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use(
    '/uploads',
    express.static(process.env.UPLOAD_BASE_PATH || '/var/www/uploads'),
  );
  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0'); // bind tất cả IP
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/docs`,
  );
}

void bootstrap();
