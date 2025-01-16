import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

const expressApp = express();
let cachedServer;

async function bootstrapServer() {
  if (!cachedServer) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    app.enableCors({
      origin: (origin, callback) => {
        if (
          !origin ||
          origin.startsWith('exp://') ||
          origin === 'http://localhost:19000'
        ) {
          return callback(null, true);
        }
      },
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

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith('exp://') ||
        origin === 'http://localhost:19000'
      ) {
        return callback(null, true);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
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
