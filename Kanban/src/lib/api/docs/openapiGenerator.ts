/**
 * OpenAPI Generator - Generate OpenAPI specification from code
 * FR-001: API-First Design - OpenAPI specification generator
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';

export interface OpenAPIGeneratorConfig {
  title: string;
  version: string;
  description: string;
  servers: OpenAPIV3.ServerObject[];
  contact?: OpenAPIV3.ContactObject;
  license?: OpenAPIV3.LicenseObject;
  tags?: OpenAPIV3.TagObject[];
  security?: OpenAPIV3.SecurityRequirementObject[];
  components?: OpenAPIV3.ComponentsObject;
}

export class OpenAPIGenerator {
  private static instance: OpenAPIGenerator;
  private config: OpenAPIGeneratorConfig;
  private spec: OpenAPIV3.Document;

  constructor() {
    this.config = {
      title: 'Kanban Project Management API',
      version: '1.0.0',
      description: 'RESTful API for Kanban project management with real-time collaboration',
      servers: [
        {
          url: 'https://api.kanban-app.com/v1',
          description: 'Production server',
        },
        {
          url: 'https://staging-api.kanban-app.com/v1',
          description: 'Staging server',
        },
        {
          url: 'http://localhost:3000/api/v1',
          description: 'Development server',
        },
      ],
      contact: {
        name: 'API Support',
        email: 'support@kanban-app.com',
        url: 'https://kanban-app.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      tags: [
        {
          name: 'Authentication',
          description: 'User authentication and authorization',
        },
        {
          name: 'Workspaces',
          description: 'Workspace management',
        },
        {
          name: 'Boards',
          description: 'Board management',
        },
        {
          name: 'Tasks',
          description: 'Task management',
        },
        {
          name: 'Users',
          description: 'User management',
        },
      ],
      security: [
        {
          BearerAuth: [],
        },
      ],
    };

    this.spec = this.initializeSpec();
  }

  public static getInstance(): OpenAPIGenerator {
    if (!OpenAPIGenerator.instance) {
      OpenAPIGenerator.instance = new OpenAPIGenerator();
    }
    return OpenAPIGenerator.instance;
  }

  private initializeSpec(): OpenAPIV3.Document {
    return {
      openapi: '3.0.3',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
        contact: this.config.contact,
        license: this.config.license,
      },
      servers: this.config.servers,
      tags: this.config.tags,
      security: this.config.security,
      paths: {},
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token for authentication',
          },
        },
        schemas: this.getSchemas(),
        responses: this.getResponses(),
        parameters: this.getParameters(),
        examples: this.getExamples(),
      },
    };
  }

  private getSchemas(): Record<string, OpenAPIV3.SchemaObject> {
    return {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the user',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          fullName: {
            type: 'string',
            description: 'User full name',
          },
          avatar: {
            type: 'string',
            format: 'uri',
            description: 'User avatar URL',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'User last update timestamp',
          },
        },
        required: ['id', 'email', 'fullName', 'createdAt', 'updatedAt'],
      },
      Workspace: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the workspace',
          },
          name: {
            type: 'string',
            description: 'Workspace name',
          },
          description: {
            type: 'string',
            description: 'Workspace description',
          },
          ownerId: {
            type: 'string',
            format: 'uuid',
            description: 'Workspace owner ID',
          },
          memberCount: {
            type: 'integer',
            description: 'Number of workspace members',
          },
          boardCount: {
            type: 'integer',
            description: 'Number of boards in workspace',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Workspace creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Workspace last update timestamp',
          },
        },
        required: ['id', 'name', 'ownerId', 'memberCount', 'boardCount', 'createdAt', 'updatedAt'],
      },
      Board: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the board',
          },
          name: {
            type: 'string',
            description: 'Board name',
          },
          description: {
            type: 'string',
            description: 'Board description',
          },
          workspaceId: {
            type: 'string',
            format: 'uuid',
            description: 'Workspace ID',
          },
          columns: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Column',
            },
            description: 'Board columns',
          },
          taskCount: {
            type: 'integer',
            description: 'Number of tasks in board',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Board creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Board last update timestamp',
          },
        },
        required: ['id', 'name', 'workspaceId', 'columns', 'taskCount', 'createdAt', 'updatedAt'],
      },
      Column: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the column',
          },
          name: {
            type: 'string',
            description: 'Column name',
          },
          position: {
            type: 'integer',
            description: 'Column position',
          },
          color: {
            type: 'string',
            pattern: '^#[0-9A-Fa-f]{6}$',
            description: 'Column color in hex format',
          },
          taskLimit: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            description: 'Maximum number of tasks in column',
          },
        },
        required: ['id', 'name', 'position'],
      },
      Task: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the task',
          },
          title: {
            type: 'string',
            description: 'Task title',
          },
          description: {
            type: 'string',
            description: 'Task description',
          },
          status: {
            type: 'string',
            enum: ['todo', 'in_progress', 'done'],
            description: 'Task status',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Task priority',
          },
          boardId: {
            type: 'string',
            format: 'uuid',
            description: 'Board ID',
          },
          columnId: {
            type: 'string',
            format: 'uuid',
            description: 'Column ID',
          },
          assigneeId: {
            type: 'string',
            format: 'uuid',
            description: 'Assignee user ID',
          },
          position: {
            type: 'integer',
            description: 'Task position in column',
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'Task due date',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Task tags',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Task creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Task last update timestamp',
          },
        },
        required: ['id', 'title', 'status', 'priority', 'boardId', 'columnId', 'position', 'createdAt', 'updatedAt'],
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            description: 'Current page number',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            description: 'Number of items per page',
          },
          total: {
            type: 'integer',
            minimum: 0,
            description: 'Total number of items',
          },
          pages: {
            type: 'integer',
            minimum: 0,
            description: 'Total number of pages',
          },
          hasNext: {
            type: 'boolean',
            description: 'Whether there is a next page',
          },
          hasPrev: {
            type: 'boolean',
            description: 'Whether there is a previous page',
          },
        },
        required: ['page', 'limit', 'total', 'pages', 'hasNext', 'hasPrev'],
      },
      ResponseMeta: {
        type: 'object',
        properties: {
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp',
          },
          version: {
            type: 'string',
            description: 'API version',
          },
          requestId: {
            type: 'string',
            description: 'Request ID for tracing',
          },
          duration: {
            type: 'integer',
            description: 'Request duration in milliseconds',
          },
        },
        required: ['timestamp', 'version'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Error code',
              },
              message: {
                type: 'string',
                description: 'Error message',
              },
              details: {
                type: 'object',
                description: 'Additional error details',
              },
            },
            required: ['code', 'message'],
          },
          meta: {
            $ref: '#/components/schemas/ResponseMeta',
          },
        },
        required: ['error', 'meta'],
      },
      ValidationError: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            description: 'Field name',
          },
          message: {
            type: 'string',
            description: 'Validation error message',
          },
          value: {
            type: 'string',
            description: 'Invalid value',
          },
        },
        required: ['field', 'message'],
      },
    };
  }

  private getResponses(): Record<string, OpenAPIV3.ResponseObject> {
    return {
      Success: {
        description: 'Success response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: true,
                },
                message: {
                  type: 'string',
                  example: 'Operation completed successfully',
                },
                meta: {
                  $ref: '#/components/schemas/ResponseMeta',
                },
              },
            },
          },
        },
      },
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              error: {
                code: 'BAD_REQUEST',
                message: 'Invalid request parameters',
              },
              meta: {
                timestamp: '2023-01-01T00:00:00.000Z',
                version: '1.0.0',
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
              },
              meta: {
                timestamp: '2023-01-01T00:00:00.000Z',
                version: '1.0.0',
              },
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions',
              },
              meta: {
                timestamp: '2023-01-01T00:00:00.000Z',
                version: '1.0.0',
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              error: {
                code: 'NOT_FOUND',
                message: 'Resource not found',
              },
              meta: {
                timestamp: '2023-01-01T00:00:00.000Z',
                version: '1.0.0',
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: {
                  fields: [
                    {
                      field: 'email',
                      message: 'Invalid email format',
                      value: 'invalid-email',
                    },
                  ],
                },
              },
              meta: {
                timestamp: '2023-01-01T00:00:00.000Z',
                version: '1.0.0',
              },
            },
          },
        },
      },
      RateLimitExceeded: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests',
                details: {
                  limit: 100,
                  remaining: 0,
                  reset: 1640995200,
                  retryAfter: 300,
                },
              },
              meta: {
                timestamp: '2023-01-01T00:00:00.000Z',
                version: '1.0.0',
              },
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'An internal error occurred',
              },
              meta: {
                timestamp: '2023-01-01T00:00:00.000Z',
                version: '1.0.0',
              },
            },
          },
        },
      },
    };
  }

  private getParameters(): Record<string, OpenAPIV3.ParameterObject> {
    return {
      Page: {
        name: 'page',
        in: 'query',
        description: 'Page number',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      Limit: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
      },
      Search: {
        name: 'search',
        in: 'query',
        description: 'Search query',
        required: false,
        schema: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
      },
      Sort: {
        name: 'sort',
        in: 'query',
        description: 'Sort field',
        required: false,
        schema: {
          type: 'string',
          enum: ['createdAt', 'updatedAt', 'name', 'title'],
        },
      },
      Order: {
        name: 'order',
        in: 'query',
        description: 'Sort order',
        required: false,
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
    };
  }

  private getExamples(): Record<string, OpenAPIV3.ExampleObject> {
    return {
      UserExample: {
        summary: 'User example',
        value: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          fullName: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      },
      WorkspaceExample: {
        summary: 'Workspace example',
        value: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'My Workspace',
          description: 'A sample workspace',
          ownerId: '123e4567-e89b-12d3-a456-426614174001',
          memberCount: 5,
          boardCount: 3,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      },
      BoardExample: {
        summary: 'Board example',
        value: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Project Board',
          description: 'A sample project board',
          workspaceId: '123e4567-e89b-12d3-a456-426614174001',
          columns: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: 'To Do',
              position: 0,
              color: '#3B82F6',
              taskLimit: 10,
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              name: 'In Progress',
              position: 1,
              color: '#F59E0B',
              taskLimit: 5,
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174004',
              name: 'Done',
              position: 2,
              color: '#10B981',
              taskLimit: 20,
            },
          ],
          taskCount: 15,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      },
      TaskExample: {
        summary: 'Task example',
        value: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Implement user authentication',
          description: 'Add JWT-based authentication to the API',
          status: 'in_progress',
          priority: 'high',
          boardId: '123e4567-e89b-12d3-a456-426614174001',
          columnId: '123e4567-e89b-12d3-a456-426614174002',
          assigneeId: '123e4567-e89b-12d3-a456-426614174003',
          position: 0,
          dueDate: '2023-12-31T23:59:59.000Z',
          tags: ['backend', 'authentication', 'jwt'],
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      },
    };
  }

  public generateSpec(): OpenAPIV3.Document {
    return this.spec;
  }

  public async saveSpec(outputPath: string, format: 'json' | 'yaml' = 'yaml'): Promise<void> {
    const spec = this.generateSpec();
    const content = format === 'json' 
      ? JSON.stringify(spec, null, 2)
      : yaml.dump(spec, { indent: 2 });

    await fs.promises.writeFile(outputPath, content, 'utf8');
  }

  public addPath(path: string, pathItem: OpenAPIV3.PathItemObject): void {
    this.spec.paths[path] = pathItem;
  }

  public addSchema(name: string, schema: OpenAPIV3.SchemaObject): void {
    if (!this.spec.components) {
      this.spec.components = {};
    }
    if (!this.spec.components.schemas) {
      this.spec.components.schemas = {};
    }
    this.spec.components.schemas[name] = schema;
  }

  public addResponse(name: string, response: OpenAPIV3.ResponseObject): void {
    if (!this.spec.components) {
      this.spec.components = {};
    }
    if (!this.spec.components.responses) {
      this.spec.components.responses = {};
    }
    this.spec.components.responses[name] = response;
  }

  public addParameter(name: string, parameter: OpenAPIV3.ParameterObject): void {
    if (!this.spec.components) {
      this.spec.components = {};
    }
    if (!this.spec.components.parameters) {
      this.spec.components.parameters = {};
    }
    this.spec.components.parameters[name] = parameter;
  }

  public addExample(name: string, example: OpenAPIV3.ExampleObject): void {
    if (!this.spec.components) {
      this.spec.components = {};
    }
    if (!this.spec.components.examples) {
      this.spec.components.examples = {};
    }
    this.spec.components.examples[name] = example;
  }

  public updateConfig(config: Partial<OpenAPIGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
    this.spec = this.initializeSpec();
  }

  public getConfig(): OpenAPIGeneratorConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const openAPIGenerator = OpenAPIGenerator.getInstance();
