import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    const config = new DocumentBuilder()
      .setTitle('Pademi')
      .setDescription(
        'Meet Minds Backend API Documentation - Social Events and Dining Experiences Platform',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Create custom Swagger HTML that loads CDN resources directly
    expressApp.get('/api/docs', (req, res) => {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pademi API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
        <style>
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info { margin: 50px 0; }
          body { margin: 0; background: #fafafa; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              url: '/api/docs-json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout",
              persistAuthorization: true,
              displayRequestDuration: true,
              docExpansion: 'list',
              filter: true,
              tryItOutEnabled: true
            });
          };
        </script>
      </body>
      </html>`;
      res.send(html);
    });

    // Setup docs-json endpoint
    expressApp.get('/api/docs-json', (req, res) => {
      res.json(document);
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

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Pademi')
    .setDescription(
      'Pademi Backend API Documentation - Social Events and Dining Experiences Platform',
    )
    .setVersion('1.0')
    .addTag('authentication', 'User authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('profiles', 'User profile management')
    .addTag('events', 'Group event management (existing system)')
    .addTag('restaurants', 'Restaurant management and discovery')
    .addTag('personal-dining', 'One-on-one personal dining experiences')
    .addTag('payments', 'Payment processing')
    .addTag('kyc', 'Know Your Customer verification')
    .addBearerAuth()
    .addServer('http://localhost:8000', 'Local development server')
    .addServer('https://your-production-url.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Pademi Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
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
