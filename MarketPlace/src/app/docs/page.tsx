import React from 'react';
import ApiDocs from '../../components/docs/ApiDocs';

const endpoints = [
  {
    path: '/auth/register',
    method: 'POST',
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 8 },
              firstName: { type: 'string', minLength: 1, maxLength: 50 },
              lastName: { type: 'string', minLength: 1, maxLength: 50 },
              phoneNumber: { type: 'string', pattern: '^\\+?[\\d\\s\\-\\(\\)]+$' },
            },
            required: ['email', 'password', 'firstName', 'lastName'],
          },
        },
      },
    },
    responses: {
      '201': { description: 'User registered successfully' },
      '400': { description: 'Validation error' },
      '409': { description: 'User already exists' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/auth/login',
    method: 'POST',
    summary: 'Login user',
    description: 'Authenticate user and return session token',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 1 },
            },
            required: ['email', 'password'],
          },
        },
      },
    },
    responses: {
      '200': { description: 'Login successful' },
      '400': { description: 'Validation error' },
      '401': { description: 'Invalid credentials' },
      '403': { description: 'Account deactivated' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/auth/logout',
    method: 'POST',
    summary: 'Logout user',
    description: 'Invalidate user session',
    responses: {
      '200': { description: 'Logout successful' },
      '401': { description: 'Authentication required' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/products',
    method: 'GET',
    summary: 'Get products',
    description: 'Retrieve a list of products with filtering and pagination',
    parameters: [
      {
        name: 'page',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number',
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Number of items per page',
      },
      {
        name: 'category',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Filter by category',
      },
      {
        name: 'search',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Search term',
      },
      {
        name: 'minPrice',
        in: 'query',
        required: false,
        schema: { type: 'number', minimum: 0 },
        description: 'Minimum price',
      },
      {
        name: 'maxPrice',
        in: 'query',
        required: false,
        schema: { type: 'number', minimum: 0 },
        description: 'Maximum price',
      },
      {
        name: 'sortBy',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['name', 'price', 'createdAt', 'updatedAt'], default: 'createdAt' },
        description: 'Sort field',
      },
      {
        name: 'sortOrder',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        description: 'Sort order',
      },
    ],
    responses: {
      '200': { description: 'Products retrieved successfully' },
      '400': { description: 'Invalid query parameters' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/products',
    method: 'POST',
    summary: 'Create product',
    description: 'Create a new product',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 100 },
              description: { type: 'string', minLength: 1, maxLength: 1000 },
              price: { type: 'number', minimum: 0, multipleOf: 0.01 },
              category: { type: 'string', minLength: 1, maxLength: 50 },
              stock: { type: 'integer', minimum: 0 },
              images: { type: 'array', items: { type: 'string', format: 'uri' }, maxItems: 10 },
              tags: { type: 'array', items: { type: 'string', maxLength: 30 }, maxItems: 20 },
              isActive: { type: 'boolean', default: true },
            },
            required: ['name', 'description', 'price', 'category', 'stock'],
          },
        },
      },
    },
    responses: {
      '201': { description: 'Product created successfully' },
      '400': { description: 'Validation error' },
      '401': { description: 'Authentication required' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/products/{id}',
    method: 'GET',
    summary: 'Get product by ID',
    description: 'Retrieve a specific product by ID',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', pattern: '^c[0-9a-z]{25}$' },
        description: 'Product ID',
      },
    ],
    responses: {
      '200': { description: 'Product retrieved successfully' },
      '400': { description: 'Invalid product ID' },
      '404': { description: 'Product not found' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/products/{id}',
    method: 'PUT',
    summary: 'Update product',
    description: 'Update an existing product',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', pattern: '^c[0-9a-z]{25}$' },
        description: 'Product ID',
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 100 },
              description: { type: 'string', minLength: 1, maxLength: 1000 },
              price: { type: 'number', minimum: 0, multipleOf: 0.01 },
              category: { type: 'string', minLength: 1, maxLength: 50 },
              stock: { type: 'integer', minimum: 0 },
              images: { type: 'array', items: { type: 'string', format: 'uri' }, maxItems: 10 },
              tags: { type: 'array', items: { type: 'string', maxLength: 30 }, maxItems: 20 },
              isActive: { type: 'boolean' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Product updated successfully' },
      '400': { description: 'Validation error' },
      '401': { description: 'Authentication required' },
      '403': { description: 'Not authorized to update this product' },
      '404': { description: 'Product not found' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/products/{id}',
    method: 'DELETE',
    summary: 'Delete product',
    description: 'Delete an existing product',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', pattern: '^c[0-9a-z]{25}$' },
        description: 'Product ID',
      },
    ],
    responses: {
      '200': { description: 'Product deleted successfully' },
      '400': { description: 'Invalid product ID' },
      '401': { description: 'Authentication required' },
      '403': { description: 'Not authorized to delete this product' },
      '404': { description: 'Product not found' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/orders',
    method: 'GET',
    summary: 'Get orders',
    description: 'Retrieve user orders with filtering and pagination',
    parameters: [
      {
        name: 'page',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number',
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Number of items per page',
      },
      {
        name: 'status',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
        description: 'Filter by status',
      },
      {
        name: 'sortBy',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'totalAmount'], default: 'createdAt' },
        description: 'Sort field',
      },
      {
        name: 'sortOrder',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        description: 'Sort order',
      },
    ],
    responses: {
      '200': { description: 'Orders retrieved successfully' },
      '400': { description: 'Invalid query parameters' },
      '401': { description: 'Authentication required' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/orders',
    method: 'POST',
    summary: 'Create order',
    description: 'Create a new order',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    productId: { type: 'string', pattern: '^c[0-9a-z]{25}$' },
                    quantity: { type: 'integer', minimum: 1 },
                    price: { type: 'number', minimum: 0, multipleOf: 0.01 },
                  },
                  required: ['productId', 'quantity', 'price'],
                },
                minItems: 1,
                maxItems: 50,
              },
              shippingAddress: {
                type: 'object',
                properties: {
                  street: { type: 'string', minLength: 1, maxLength: 100 },
                  city: { type: 'string', minLength: 1, maxLength: 50 },
                  state: { type: 'string', minLength: 1, maxLength: 50 },
                  zipCode: { type: 'string', minLength: 1, maxLength: 20 },
                  country: { type: 'string', minLength: 1, maxLength: 50 },
                },
                required: ['street', 'city', 'state', 'zipCode', 'country'],
              },
              paymentMethod: { type: 'string', enum: ['credit_card', 'debit_card', 'paypal', 'stripe'] },
            },
            required: ['items', 'shippingAddress', 'paymentMethod'],
          },
        },
      },
    },
    responses: {
      '201': { description: 'Order created successfully' },
      '400': { description: 'Validation error' },
      '401': { description: 'Authentication required' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/payments/create-intent',
    method: 'POST',
    summary: 'Create payment intent',
    description: 'Create a payment intent for processing',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              orderId: { type: 'string', pattern: '^c[0-9a-z]{25}$' },
              amount: { type: 'number', minimum: 0, multipleOf: 0.01 },
              currency: { type: 'string', minLength: 3, maxLength: 3, default: 'usd' },
              paymentMethod: { type: 'string', enum: ['credit_card', 'debit_card', 'paypal', 'stripe'] },
              metadata: { type: 'object', additionalProperties: { type: 'string' } },
            },
            required: ['orderId', 'amount', 'paymentMethod'],
          },
        },
      },
    },
    responses: {
      '201': { description: 'Payment intent created successfully' },
      '400': { description: 'Validation error' },
      '401': { description: 'Authentication required' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/payments/confirm',
    method: 'POST',
    summary: 'Confirm payment',
    description: 'Confirm a payment intent',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              paymentIntentId: { type: 'string' },
              paymentMethodId: { type: 'string' },
            },
            required: ['paymentIntentId', 'paymentMethodId'],
          },
        },
      },
    },
    responses: {
      '200': { description: 'Payment confirmed successfully' },
      '400': { description: 'Payment confirmation failed' },
      '401': { description: 'Authentication required' },
      '500': { description: 'Internal server error' },
    },
  },
  {
    path: '/health',
    method: 'GET',
    summary: 'Health check',
    description: 'Check API health status',
    responses: {
      '200': { description: 'API is healthy' },
      '503': { description: 'API is unhealthy' },
    },
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ApiDocs endpoints={endpoints} baseUrl="/api/v1" />
    </div>
  );
}
