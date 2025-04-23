import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';

const expressApp = express();
let cachedServer;

expressApp.use((req, res, next) => {
  // const allowedOrigins = [
  //   'http://localhost:3000/',
  //   'https://pademi.events/',
  //   'https://www.pademi.events/',
  //   'https://www.octinnovations.com/',
  // ];

  const origin = req.headers.origin;
  // if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

async function bootstrapServer() {
  if (!cachedServer) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.enableCors({
      origin: '*',
      // origin: [
      //   'http://localhost:3000/',
      //   'https://pademi.events/',
      //   'https://www.pademi.events/',
      //   'https://www.octinnovations.com/',
      // ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 8001;
  await app.listen(port, '0.0.0.0');
}

const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  module.exports = async (req, res) => {
    const server = await bootstrapServer();
    return server(req, res);
  };
} else {
  bootstrap().catch((err) => console.error(err));
}
