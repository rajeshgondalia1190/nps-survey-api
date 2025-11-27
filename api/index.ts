import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const server = express();
let app: any = null;

async function bootstrap() {
  if (!app) {
    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server));

    // Global prefix
    nestApp.setGlobalPrefix('api');

    // CORS
    nestApp.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Validation
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Swagger Documentation
    const config = new DocumentBuilder()
      .setTitle('NPS Survey API')
      .setDescription('Backend API for NPS Survey Agent Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(nestApp, config);
    SwaggerModule.setup('api/docs', nestApp, document);

    await nestApp.init();
    app = nestApp;
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await bootstrap();
  server(req as any, res as any);
}
