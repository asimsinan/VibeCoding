/**
 * Swagger Middleware
 * TASK-018: API Documentation - FR-001 through FR-007
 * 
 * This middleware provides Swagger UI and OpenAPI documentation
 * for the Personal Shopping Assistant API.
 */

import { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { generateOpenAPISpec } from './openapiGenerator';

/**
 * Swagger UI middleware
 * Serves the Swagger UI interface
 */
export const swaggerUI = swaggerUi.setup(generateOpenAPISpec(), {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 4px; }
  `,
  customSiteTitle: 'Personal Shopping Assistant API',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // Add authentication header if available
      const token = localStorage.getItem('authToken');
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
      return req;
    }
  }
});

/**
 * Serve OpenAPI JSON specification
 */
export const serveOpenAPISpec = (req: Request, res: Response): void => {
  const spec = generateOpenAPISpec();
  res.setHeader('Content-Type', 'application/json');
  res.json(spec);
};

/**
 * Serve Swagger UI
 */
export const serveSwaggerUI = swaggerUi.serve;

/**
 * API documentation middleware
 * Provides documentation endpoints and metadata
 */
export const apiDocumentation = (req: Request, res: Response): void => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.json({
    success: true,
    message: 'Personal Shopping Assistant API Documentation',
    version: '1.0.0',
    documentation: {
      openapi: `${baseUrl}/api/v1/openapi.json`,
      swagger: `${baseUrl}/api/v1/swagger`,
      postman: `${baseUrl}/api/v1/postman.json`
    },
    endpoints: {
      health: `${baseUrl}/health`,
      users: `${baseUrl}/api/v1/users`,
      products: `${baseUrl}/api/v1/products`,
      interactions: `${baseUrl}/api/v1/interactions`,
      recommendations: `${baseUrl}/api/v1/recommendations`
    },
    authentication: {
      type: 'Bearer Token',
      description: 'Include your JWT token in the Authorization header',
      example: 'Authorization: Bearer <your-jwt-token>'
    },
    rateLimiting: {
      description: 'API requests are rate limited to prevent abuse',
      limits: {
        general: '100 requests per 15 minutes',
        auth: '10 requests per 15 minutes',
        search: '50 requests per 15 minutes'
      }
    }
  });
};

/**
 * Postman collection generator
 * Generates a Postman collection for easy API testing
 */
export const generatePostmanCollection = (req: Request, res: Response): void => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const collection = {
    info: {
      name: 'Personal Shopping Assistant API',
      description: 'A virtual personal shopping assistant that suggests products based on user preferences',
      version: '1.0.0',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{jwt_token}}',
          type: 'string'
        }
      ]
    },
    variable: [
      {
        key: 'base_url',
        value: baseUrl,
        type: 'string'
      },
      {
        key: 'jwt_token',
        value: '',
        type: 'string'
      }
    ],
    item: [
      {
        name: 'Authentication',
        item: [
          {
            name: 'Register User',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  email: 'user@example.com',
                  password: 'password123',
                  preferences: {
                    categories: ['electronics', 'clothing'],
                    priceRange: { min: 0, max: 1000 },
                    brands: ['Apple', 'Nike'],
                    stylePreferences: ['modern', 'casual']
                  }
                }, null, 2)
              },
              url: {
                raw: '{{base_url}}/api/v1/users/register',
                host: ['{{base_url}}'],
                path: ['api', 'v1', 'users', 'register']
              }
            }
          },
          {
            name: 'Login User',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  email: 'user@example.com',
                  password: 'password123'
                }, null, 2)
              },
              url: {
                raw: '{{base_url}}/api/v1/users/login',
                host: ['{{base_url}}'],
                path: ['api', 'v1', 'users', 'login']
              }
            }
          }
        ]
      },
      {
        name: 'Products',
        item: [
          {
            name: 'Get Products',
            request: {
              method: 'GET',
              url: {
                raw: '{{base_url}}/api/v1/products?page=1&limit=20',
                host: ['{{base_url}}'],
                path: ['api', 'v1', 'products'],
                query: [
                  {
                    key: 'page',
                    value: '1'
                  },
                  {
                    key: 'limit',
                    value: '20'
                  }
                ]
              }
            }
          },
          {
            name: 'Search Products',
            request: {
              method: 'GET',
              url: {
                raw: '{{base_url}}/api/v1/products/search?q=smartphone&limit=10',
                host: ['{{base_url}}'],
                path: ['api', 'v1', 'products', 'search'],
                query: [
                  {
                    key: 'q',
                    value: 'smartphone'
                  },
                  {
                    key: 'limit',
                    value: '10'
                  }
                ]
              }
            }
          }
        ]
      },
      {
        name: 'Recommendations',
        item: [
          {
            name: 'Get Recommendations',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Authorization',
                  value: 'Bearer {{jwt_token}}'
                }
              ],
              url: {
                raw: '{{base_url}}/api/v1/recommendations?limit=10',
                host: ['{{base_url}}'],
                path: ['api', 'v1', 'recommendations'],
                query: [
                  {
                    key: 'limit',
                    value: '10'
                  }
                ]
              }
            }
          }
        ]
      }
    ]
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="personal-shopping-assistant-api.postman_collection.json"');
  res.json(collection);
};

/**
 * API health check for documentation
 */
export const documentationHealth = (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'API Documentation is healthy',
    timestamp: new Date().toISOString(),
    services: {
      swagger: 'available',
      openapi: 'available',
      postman: 'available'
    }
  });
};
