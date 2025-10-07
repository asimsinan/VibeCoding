/**
 * API Documentation Page - Interactive API documentation
 * FR-001: API-First Design - API documentation page
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createApiClient } from '../../src/lib/api/client/apiClient';
import { getApiService } from '../../src/lib/api/services/apiService';

interface ApiResponse {
  description: string;
  content?: any;
}

interface ApiEndpoint {
  method: string;
  path: string;
  summary: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: Record<string, ApiResponse>;
}

interface ApiProperty {
  type: string;
  format?: string;
  description?: string;
}

interface ApiSchema {
  name: string;
  type: string;
  properties?: Record<string, ApiProperty>;
  example?: any;
}

export default function ApiDocsPage() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [schemas, setSchemas] = useState<ApiSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'schemas' | 'try-it'>('overview');

  useEffect(() => {
    loadApiSpec();
  }, []);

  const loadApiSpec = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, you would load the OpenAPI spec from a file or API
      // For now, we'll use mock data
      const mockEndpoints: ApiEndpoint[] = [
        {
          method: 'POST',
          path: '/auth/login',
          summary: 'User login',
          description: 'Authenticate a user with email and password',
          requestBody: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 8 }
            },
            required: ['email', 'password']
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                      expiresIn: { type: 'number' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        {
          method: 'GET',
          path: '/workspaces',
          summary: 'List workspaces',
          description: 'Get all workspaces for the authenticated user',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', minimum: 1 },
              description: 'Page number'
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: 100 },
              description: 'Number of items per page'
            }
          ],
          responses: {
            '200': {
              description: 'List of workspaces',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Workspace' }
                      },
                      meta: {
                        type: 'object',
                        properties: {
                          pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          method: 'POST',
          path: '/workspaces',
          summary: 'Create workspace',
          description: 'Create a new workspace',
          requestBody: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 100 },
              description: { type: 'string', maxLength: 500 }
            },
            required: ['name']
          },
          responses: {
            '201': {
              description: 'Workspace created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Workspace' },
                      meta: { $ref: '#/components/schemas/ResponseMeta' }
                    }
                  }
                }
              }
            }
          }
        }
      ];

      const mockSchemas: ApiSchema[] = [
        {
          name: 'User',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            fullName: { type: 'string' },
            avatar: { type: 'string', format: 'uri' }
          },
          example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user@example.com',
            fullName: 'John Doe',
            avatar: 'https://example.com/avatar.jpg'
          }
        },
        {
          name: 'Workspace',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            ownerId: { type: 'string', format: 'uuid' },
            memberCount: { type: 'integer' },
            boardCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'My Workspace',
            description: 'A sample workspace',
            ownerId: '123e4567-e89b-12d3-a456-426614174001',
            memberCount: 5,
            boardCount: 3,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z'
          }
        },
        {
          name: 'Pagination',
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            pages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          },
          example: {
            page: 1,
            limit: 10,
            total: 25,
            pages: 3,
            hasNext: true,
            hasPrev: false
          }
        }
      ];

      setEndpoints(mockEndpoints);
      setSchemas(mockSchemas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API specification');
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Documentation</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadApiSpec}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kanban API Documentation</h1>
          <p className="text-gray-600 text-lg">RESTful API for Kanban project management with real-time collaboration</p>
          <div className="mt-4 flex items-center space-x-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Version 1.0.0</span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">OpenAPI 3.0</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'endpoints', label: 'Endpoints' },
              { id: 'schemas', label: 'Schemas' },
              { id: 'try-it', label: 'Try It Out' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">API Overview</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Base URL</h3>
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm">https://api.kanban-app.com/v1</code>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Authentication</h3>
                  <p className="text-gray-600 mb-3">
                    This API uses Bearer token authentication. Include your access token in the Authorization header:
                  </p>
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                    Authorization: Bearer &lt;your-access-token&gt;
                  </code>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate Limiting</h3>
                  <p className="text-gray-600">
                    API requests are limited to 100 requests per 15-minute window per user. 
                    Rate limit headers are included in responses.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Error Handling</h3>
                  <p className="text-gray-600 mb-3">
                    The API uses standard HTTP status codes and returns errors in the following format:
                  </p>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": [
        {
          "field": "email",
          "message": "Invalid email format",
          "value": "invalid-email"
        }
      ]
    }
  },
  "meta": {
    "timestamp": "2023-01-01T00:00:00.000Z",
    "version": "1.0.0"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
              
              <div className="space-y-8">
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-mono">{endpoint.path}</code>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{endpoint.summary}</h3>
                    {endpoint.description && (
                      <p className="text-gray-600 mb-4">{endpoint.description}</p>
                    )}

                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Parameters</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {endpoint.parameters.map((param, paramIndex) => (
                                <tr key={paramIndex}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <code>{param.name}</code>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{param.in}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {param.required ? 'Yes' : 'No'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {param.schema?.type || 'string'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">{param.description || 'No description'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {endpoint.requestBody && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Request Body</h4>
                        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                          {JSON.stringify(endpoint.requestBody, null, 2)}
                        </pre>
                      </div>
                    )}

                    {endpoint.responses && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Responses</h4>
                        <div className="space-y-3">
                          {Object.entries(endpoint.responses).map(([status, response]) => (
                            <div key={status} className="border-l-4 border-blue-500 pl-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-mono text-sm font-medium">{status}</span>
                                <span className="text-sm text-gray-600">{response.description}</span>
                              </div>
                              {response.content && (
                                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                                  {JSON.stringify(response.content, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schemas' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Schemas</h2>
              
              <div className="space-y-8">
                {schemas.map((schema, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{schema.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">Type: {schema.type}</p>
                    
                    {schema.properties && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Properties</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {Object.entries(schema.properties).map(([propName, prop]) => (
                                <tr key={propName}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <code>{propName}</code>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prop.type}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prop.format || '-'}</td>
                                  <td className="px-6 py-4 text-sm text-gray-500">{prop.description || 'No description'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {schema.example && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Example</h4>
                        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                          {JSON.stringify(schema.example, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'try-it' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Try It Out</h2>
              <p className="text-gray-600 mb-6">
                Use the interactive API explorer to test endpoints. Make sure you have a valid access token.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Interactive Testing Not Available</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This is a demo version. In a real implementation, you would have an interactive API explorer here.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
