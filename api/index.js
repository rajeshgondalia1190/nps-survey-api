const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

const server = express();
let app = null;

async function bootstrap() {
  if (!app) {
    // Import the compiled AppModule from dist
    const { AppModule } = require('../dist/app.module');

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

    await nestApp.init();
    app = nestApp;
  }
  return app;
}

module.exports = async function handler(req, res) {
  await bootstrap();
  server(req, res);
};
