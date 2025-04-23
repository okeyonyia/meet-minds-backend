import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';

const expressApp = express();
let cachedServer;

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
      //   'http://localhost:3000',
      //   'https://pademi.events',
      //   'https://www.pademi.events',
      //   'https://www.octinnovations.com',
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

// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ExpressAdapter } from '@nestjs/platform-express';
// import express from 'express';

// const expressApp = express();
// let cachedServer;

// async function bootstrapServer() {
//   if (!cachedServer) {
//     const app = await NestFactory.create(
//       AppModule,
//       new ExpressAdapter(expressApp),
//     );
//     app.enableCors({
//       origin: (origin, callback) => {
//         if (!origin) return callback(null, true);

//         const allowedOrigins = [
//           'http://localhost:3000',
//           'https://pademi.events',
//           'https://www.pademi.events/',
//           'https://https://www.octinnovations.com',
//           'http://localhost:8000',
//         ];
//         if (allowedOrigins.includes(origin)) {
//           callback(null, true);
//         } else {
//           callback(new Error('Not allowed by CORS'));
//         }
//       },
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

//   app.enableCors({
//     origin: (origin, callback) => {
//       if (!origin) return callback(null, true);

//       const allowedOrigins = [
//         'http://localhost:3000',
//         'https://pademi.events',
//         'https://www.pademi.events/',
//         'https://https://www.octinnovations.com',
//         'http://localhost:8000',
//       ];
//       if (allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     },
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//     credentials: true,
//   });

//   const port = process.env.PORT || 3000;
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
