/**
 * OpenAPI Specification Generator
 * TASK-018: API Documentation - FR-001 through FR-007
 * 
 * This module generates a comprehensive OpenAPI 3.0 specification
 * for the Personal Shopping Assistant API.
 */

export const generateOpenAPISpec = () => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  
  return {
    openapi: '3.0.0',
    info: {
      title: 'Personal Shopping Assistant API',
      description: 'A virtual personal shopping assistant that suggests products based on user preferences. This API provides endpoints for user management, product catalog, interaction tracking, and personalized recommendations.',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@personalshoppingassistant.com',
        url: 'https://personalshoppingassistant.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: baseUrl,
        description: 'Development server'
      },
      {
        url: 'https://api.personalshoppingassistant.com',
        description: 'Production server'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration'
      },
      {
        name: 'Users',
        description: 'User management and profiles'
      },
      {
        name: 'Products',
        description: 'Product catalog and search'
      },
      {
        name: 'Interactions',
        description: 'User interaction tracking'
      },
      {
        name: 'Recommendations',
        description: 'Personalized product recommendations'
      },
      {
        name: 'Health',
        description: 'System health and monitoring'
      }
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health Check',
          description: 'Check if the API is running and healthy',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                      version: { type: 'string' },
                      status: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/users/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user',
          description: 'Create a new user account with email, password, and preferences',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'preferences'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'user@example.com'
                    },
                    password: {
                      type: 'string',
                      minLength: 8,
                      example: 'password123'
                    },
                    preferences: {
                      type: 'object',
                      required: ['categories', 'priceRange', 'brands', 'stylePreferences'],
                      properties: {
                        categories: {
                          type: 'array',
                          items: { type: 'string' },
                          example: ['electronics', 'clothing']
                        },
                        priceRange: {
                          type: 'object',
                          properties: {
                            min: { type: 'number', minimum: 0 },
                            max: { type: 'number', minimum: 0 }
                          },
                          example: { min: 0, max: 1000 }
                        },
                        brands: {
                          type: 'array',
                          items: { type: 'string' },
                          example: ['Apple', 'Nike']
                        },
                        stylePreferences: {
                          type: 'array',
                          items: { type: 'string' },
                          example: ['modern', 'casual']
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '409': {
              description: 'User already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/v1/users/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          description: 'Authenticate user with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'user@example.com'
                    },
                    password: {
                      type: 'string',
                      example: 'password123'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        }
      },
      '/api/v1/users/profile': {
        get: {
          tags: ['Users'],
          summary: 'Get user profile',
          description: 'Get the current user\'s profile information',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User profile retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/UserProfile' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Authentication required',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        put: {
          tags: ['Users'],
          summary: 'Update user profile',
          description: 'Update the current user\'s profile information',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    preferences: { $ref: '#/components/schemas/UserPreferences' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Profile updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/products': {
        get: {
          tags: ['Products'],
          summary: 'Get products',
          description: 'Retrieve products with optional filtering and pagination',
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: { type: 'integer', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Items per page',
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
            },
            {
              name: 'category',
              in: 'query',
              description: 'Filter by category',
              schema: { type: 'string' }
            },
            {
              name: 'brand',
              in: 'query',
              description: 'Filter by brand',
              schema: { type: 'string' }
            },
            {
              name: 'minPrice',
              in: 'query',
              description: 'Minimum price',
              schema: { type: 'number', minimum: 0 }
            },
            {
              name: 'maxPrice',
              in: 'query',
              description: 'Maximum price',
              schema: { type: 'number', minimum: 0 }
            },
            {
              name: 'availability',
              in: 'query',
              description: 'Filter by availability',
              schema: { type: 'boolean' }
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search query',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Products retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          products: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Product' }
                          },
                          pagination: { $ref: '#/components/schemas/Pagination' },
                          filters: { $ref: '#/components/schemas/ProductFilter' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/products/search': {
        get: {
          tags: ['Products'],
          summary: 'Search products',
          description: 'Search products by query string',
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              description: 'Search query',
              schema: { type: 'string', minLength: 2 }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of results',
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
            },
            {
              name: 'offset',
              in: 'query',
              description: 'Number of results to skip',
              schema: { type: 'integer', minimum: 0, default: 0 }
            }
          ],
          responses: {
            '200': {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          products: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Product' }
                          },
                          query: { type: 'string' },
                          pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/interactions': {
        post: {
          tags: ['Interactions'],
          summary: 'Record interaction',
          description: 'Record a user interaction with a product',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['productId', 'type'],
                  properties: {
                    productId: {
                      type: 'integer',
                      description: 'Product ID'
                    },
                    type: {
                      type: 'string',
                      enum: ['view', 'like', 'dislike', 'purchase'],
                      description: 'Interaction type'
                    },
                    metadata: {
                      type: 'object',
                      description: 'Additional interaction metadata'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Interaction recorded successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: { $ref: '#/components/schemas/Interaction' }
                    }
                  }
                }
              }
            }
          }
        },
        get: {
          tags: ['Interactions'],
          summary: 'Get user interactions',
          description: 'Get the current user\'s interaction history',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: { type: 'integer', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Items per page',
              schema: { type: 'integer', minimum: 1, maximum: 1000, default: 20 }
            }
          ],
          responses: {
            '200': {
              description: 'Interactions retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          interactions: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Interaction' }
                          },
                          pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/recommendations': {
        get: {
          tags: ['Recommendations'],
          summary: 'Get recommendations',
          description: 'Get personalized product recommendations for the current user',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of recommendations',
              schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
            },
            {
              name: 'algorithm',
              in: 'query',
              description: 'Recommendation algorithm',
              schema: {
                type: 'string',
                enum: ['collaborative', 'content-based', 'hybrid', 'popularity'],
                default: 'hybrid'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Recommendations retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          recommendations: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Recommendation' }
                          },
                          algorithm: { type: 'string' },
                          count: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            preferences: { $ref: '#/components/schemas/UserPreferences' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            preferences: { $ref: '#/components/schemas/UserPreferences' },
            interactionStats: { $ref: '#/components/schemas/InteractionStats' },
            lastActiveAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        UserPreferences: {
          type: 'object',
          properties: {
            categories: {
              type: 'array',
              items: { type: 'string' },
              description: 'Preferred product categories'
            },
            priceRange: {
              type: 'object',
              properties: {
                min: { type: 'number', minimum: 0 },
                max: { type: 'number', minimum: 0 }
              },
              description: 'Preferred price range'
            },
            brands: {
              type: 'array',
              items: { type: 'string' },
              description: 'Preferred brands'
            },
            stylePreferences: {
              type: 'array',
              items: { type: 'string' },
              description: 'Style preferences'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            category: { type: 'string' },
            brand: { type: 'string' },
            imageUrl: { type: 'string', format: 'uri' },
            availability: { type: 'boolean' },
            style: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Interaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            productId: { type: 'integer' },
            type: {
              type: 'string',
              enum: ['view', 'like', 'dislike', 'purchase']
            },
            metadata: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Recommendation: {
          type: 'object',
          properties: {
            productId: { type: 'integer' },
            score: { type: 'number', minimum: 0, maximum: 1 },
            algorithm: {
              type: 'string',
              enum: ['collaborative', 'content-based', 'hybrid', 'popularity']
            },
            confidence: {
              type: 'string',
              enum: ['high', 'medium', 'low']
            },
            reason: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        },
        InteractionStats: {
          type: 'object',
          properties: {
            totalInteractions: { type: 'integer' },
            purchases: { type: 'integer' },
            likes: { type: 'integer' },
            views: { type: 'integer' },
            dislikes: { type: 'integer' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            hasMore: { type: 'boolean' }
          }
        },
        ProductFilter: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            brand: { type: 'string' },
            minPrice: { type: 'number' },
            maxPrice: { type: 'number' },
            availability: { type: 'boolean' },
            searchQuery: { type: 'string' },
            sortBy: { type: 'string' },
            sortOrder: { type: 'string', enum: ['ASC', 'DESC'] }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                status: { type: 'integer' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
                method: { type: 'string' }
              }
            }
          }
        }
      }
    }
  };
};
