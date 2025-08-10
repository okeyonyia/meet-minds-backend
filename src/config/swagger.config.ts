import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

/**
 * Swagger Documentation Configuration
 */
export class SwaggerConfig {
  /**
   * Create base Swagger configuration (inspired by mapzee-backend)
   */
  private static createSwaggerConfig() {
    return new DocumentBuilder()
      .setVersion('1.0')
      .setTitle('Meet Minds API')
      .setDescription(
        'Social Events and Dining Experiences Platform API Documentation',
      )
      .build();
  }

  /**
   * Setup Swagger for local development
   */
  public static setupLocal(app: INestApplication): void {
    const config = this.createSwaggerConfig();
    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Pademi Documentation',
    });
  }

  /**
   * Setup custom Swagger routes for Vercel production
   */
  public static setupVercel(app: INestApplication, expressApp: any): any {
    const config = this.createSwaggerConfig();
    const document = SwaggerModule.createDocument(app, config);

    // Custom Swagger HTML route for production
    expressApp.get('/api/docs', (req: any, res: any) => {
      const html = this.generateSwaggerHTML();
      res.send(html);
    });

    // OpenAPI JSON endpoint
    expressApp.get('/api/docs-json', (req: any, res: any) => {
      res.json(document);
    });

    return document;
  }

  /**
   * Generate custom Swagger HTML that loads CDN resources directly
   */
  private static generateSwaggerHTML(): string {
    return `
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
        .swagger-ui .scheme-container { background: transparent; }
        body { 
          margin: 0; 
          background: #fafafa; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .swagger-ui .info .title {
          font-size: 36px;
          color: #3b4151;
        }
        .swagger-ui .info .description {
          font-size: 16px;
          color: #3b4151;
        }
        /* Loading spinner */
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          flex-direction: column;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div id="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading API Documentation...</p>
      </div>
      <div id="swagger-ui" style="display: none;"></div>
      
      <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          try {
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
              showExtensions: true,
              showCommonExtensions: true,
              tryItOutEnabled: true,
              requestInterceptor: function(req) {
                return req;
              },
              onComplete: function() {
                // Hide loading, show Swagger UI
                document.getElementById('loading').style.display = 'none';
                document.getElementById('swagger-ui').style.display = 'block';
                console.log('Swagger UI loaded successfully');
              },
              onFailure: function(data) {
                console.error('Failed to load API spec:', data);
                document.getElementById('loading').innerHTML = 
                  '<div style="text-align: center; padding: 20px;">' +
                  '<h2 style="color: #e74c3c;">⚠️ Failed to Load API Documentation</h2>' +
                  '<p>Unable to load the API specification.</p>' +
                  '<p><strong>Try:</strong></p>' +
                  '<ul style="text-align: left; max-width: 400px; margin: 0 auto;">' +
                  '<li>Refresh the page</li>' +
                  '<li>Check if the API is running</li>' +
                  '<li>Visit <a href="/api/docs-json" target="_blank">/api/docs-json</a> directly</li>' +
                  '</ul>' +
                  '</div>';
              }
            });
          } catch (error) {
            console.error('Error initializing Swagger UI:', error);
            document.getElementById('loading').innerHTML = 
              '<div style="text-align: center; padding: 20px;">' +
              '<h2 style="color: #e74c3c;">❌ Swagger UI Initialization Error</h2>' +
              '<p>There was an error loading the documentation interface.</p>' +
              '<p>Error: ' + error.message + '</p>' +
              '</div>';
          }
        };
      </script>
    </body>
    </html>`;
  }
}
