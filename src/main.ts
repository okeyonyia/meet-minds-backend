// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ExpressAdapter } from '@nestjs/platform-express';
// import express from 'express';
// import { ValidationPipe } from '@nestjs/common';

// const expressApp = express();
// let cachedServer;

// async function bootstrapServer() {
//   if (!cachedServer) {
//     const app = await NestFactory.create(
//       AppModule,
//       new ExpressAdapter(expressApp),
//     );

//     app.setGlobalPrefix('api/v1');

//     app.useGlobalPipes(
//       new ValidationPipe({
//         transform: true,
//         transformOptions: {
//           enableImplicitConversion: true,
//         },
//       }),
//     );

//     app.enableCors({
//       // origin: '*',
//       origin: [
//         'http://localhost:3000',
//         'https://pademi.events',
//         'https://www.pademi.events',
//         'https://www.octinnovations.com',
//       ],
//       methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//       credentials: true,
//     });

//     await app.init();
//     cachedServer = expressApp;
//   }
//   return cachedServer;
// }

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.setGlobalPrefix('api/v1');

//   app.useGlobalPipes(
//     new ValidationPipe({
//       transform: true,
//       transformOptions: {
//         enableImplicitConversion: true,
//       },
//     }),
//   );

//   app.enableCors({
//     origin: '*',
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//     credentials: true,
//   });

//   const port = process.env.PORT || 8001;
//   await app.listen(port, '0.0.0.0');
// }

// const isVercel = process.env.VERCEL === '1';

// if (isVercel) {
//   module.exports = async (req, res) => {
//     const server = await bootstrapServer();
//     return server(req, res);
//   };
// } else {
//   bootstrap().catch((err) => console.error(err));
// }

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express, { Request, Response } from 'express';

const expressApp = express();
let cachedServer: typeof expressApp | null = null;

async function createNestApp(): Promise<typeof expressApp> {
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
    origin: [
      'http://localhost:3000',
      'https://pademi.events',
      'https://www.pademi.events',
      'https://www.octinnovations.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.init();

  return expressApp;
}

async function bootstrapServer(): Promise<typeof expressApp> {
  if (!cachedServer) {
    cachedServer = await createNestApp();
  }
  return cachedServer;
}

async function bootstrap(): Promise<void> {
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

// Detect if running on Vercel
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  module.exports = async (req: Request, res: Response) => {
    const server = await bootstrapServer();
    return server(req, res);
  };
} else {
  bootstrap().catch((err) => {
    console.error('NestJS bootstrap error:', err);
  });
}
