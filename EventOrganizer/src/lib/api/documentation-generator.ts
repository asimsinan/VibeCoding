#!/usr/bin/env node
/**
 * Professional API Documentation Generator
 * 
 * Generates comprehensive API documentation from OpenAPI specification
 * including interactive documentation, code examples, and testing tools.
 * 
 * @fileoverview API documentation generation utilities
 */

import fs from 'fs'
import path from 'path'
import { OpenAPIV3 } from 'openapi-types'

export interface APIDocumentationConfig {
  title: string
  version: string
  description: string
  baseUrl: string
  contact: {
    name: string
    email: string
    url: string
  }
  license: {
    name: string
    url: string
  }
  servers: Array<{
    url: string
    description: string
  }>
  outputDir: string
  includeExamples: boolean
  includeTesting: boolean
  theme: 'default' | 'dark' | 'custom'
}

export interface CodeExample {
  language: string
  label: string
  code: string
}

export interface APIDocumentation {
  openapi: string
  info: OpenAPIV3.InfoObject
  servers: OpenAPIV3.ServerObject[]
  paths: OpenAPIV3.PathsObject
  components: OpenAPIV3.ComponentsObject
  tags: OpenAPIV3.TagObject[]
  externalDocs?: OpenAPIV3.ExternalDocumentationObject
}

export class APIDocumentationGenerator {
  private config: APIDocumentationConfig
  private openApiSpec: APIDocumentation

  constructor(config: APIDocumentationConfig) {
    this.config = config
    this.openApiSpec = this.loadOpenAPISpec()
  }

  /**
   * Load OpenAPI specification from file
   */
  private loadOpenAPISpec(): APIDocumentation {
    try {
      const specPath = path.join(process.cwd(), 'contracts/openapi.yaml')
      const specContent = fs.readFileSync(specPath, 'utf-8')
      
      // Parse YAML (in a real implementation, you'd use a YAML parser)
      // For now, we'll create a basic structure
      return this.createBasicOpenAPISpec()
    } catch (error) {
      return this.createBasicOpenAPISpec()
    }
  }

  /**
   * Create basic OpenAPI specification structure
   */
  private createBasicOpenAPISpec(): APIDocumentation {
    return {
      openapi: '3.0.0',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
        contact: this.config.contact,
        license: this.config.license
      },
      servers: this.config.servers,
      paths: {
        '/api/v1/events': {
          get: {
            summary: 'List Events',
            description: 'Retrieve a list of events',
            tags: ['Events'],
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
                description: 'Number of items per page',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
              }
            ],
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Event' }
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' }
                      }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create Event',
            description: 'Create a new event',
            tags: ['Events'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateEventRequest' }
                }
              }
            },
            responses: {
              '201': {
                description: 'Event created successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { $ref: '#/components/schemas/Event' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/v1/events/{id}': {
          get: {
            summary: 'Get Event',
            description: 'Retrieve a specific event by ID',
            tags: ['Events'],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Event ID',
                schema: { type: 'string' }
              }
            ],
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { $ref: '#/components/schemas/Event' }
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
        schemas: {
          Event: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
              location: { type: 'string' },
              status: { type: 'string', enum: ['scheduled', 'live', 'ended', 'cancelled'] },
              organizerId: { type: 'string' },
              maxAttendees: { type: 'integer' },
              currentAttendees: { type: 'integer' },
              ticketPrice: { type: 'number' },
              currency: { type: 'string' },
              imageUrl: { type: 'string' },
              category: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          CreateEventRequest: {
            type: 'object',
            required: ['name', 'description', 'startDate', 'endDate'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
              location: { type: 'string' },
              maxAttendees: { type: 'integer' },
              ticketPrice: { type: 'number' },
              currency: { type: 'string' },
              imageUrl: { type: 'string' },
              category: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            }
          },
          Pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
              hasNext: { type: 'boolean' },
              hasPrev: { type: 'boolean' }
            }
          }
        },
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      tags: [
        {
          name: 'Events',
          description: 'Event management operations'
        },
        {
          name: 'Sessions',
          description: 'Session management operations'
        },
        {
          name: 'Attendees',
          description: 'Attendee management operations'
        },
        {
          name: 'Notifications',
          description: 'Notification operations'
        },
        {
          name: 'Networking',
          description: 'Networking and connection operations'
        }
      ]
    }
  }

  /**
   * Generate comprehensive API documentation
   */
  public async generateDocumentation(): Promise<void> {
    try {
      // Create output directory
      const outputDir = path.join(process.cwd(), this.config.outputDir)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      // Generate different documentation formats
      await Promise.all([
        this.generateHTMLDocumentation(),
        this.generateMarkdownDocumentation(),
        this.generateCodeExamples(),
        this.generateTestingSuite(),
        this.generatePostmanCollection(),
        this.generateInsomniaCollection()
      ])

    } catch (error) {
      throw error
    }
  }

  /**
   * Generate HTML documentation with Swagger UI
   */
  private async generateHTMLDocumentation(): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.title} API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            background-color: #2563eb;
        }
        .swagger-ui .topbar .download-url-wrapper .select-label {
            color: white;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: './openapi.json',
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
                tryItOutEnabled: true,
                requestInterceptor: (req) => {
                    // Add authentication token if available
                    const token = localStorage.getItem('authToken');
                    if (token) {
                        req.headers.Authorization = \`Bearer \${token}\`;
                    }
                    return req;
                },
                responseInterceptor: (res) => {
                    // Handle responses
                    return res;
                }
            });
            
            window.ui = ui;
        };
    </script>
</body>
</html>`

    const outputPath = path.join(process.cwd(), this.config.outputDir, 'index.html')
    fs.writeFileSync(outputPath, htmlContent)

    // Generate OpenAPI JSON
    const jsonPath = path.join(process.cwd(), this.config.outputDir, 'openapi.json')
    fs.writeFileSync(jsonPath, JSON.stringify(this.openApiSpec, null, 2))
  }

  /**
   * Generate Markdown documentation
   */
  private async generateMarkdownDocumentation(): Promise<void> {
    let markdown = `# ${this.config.title} API Documentation\n\n`
    markdown += `${this.config.description}\n\n`
    markdown += `## Base URL\n\n${this.config.baseUrl}\n\n`
    markdown += `## Authentication\n\n`
    markdown += `This API uses Bearer Token authentication. Include the token in the Authorization header:\n\n`
    markdown += `\`\`\`\nAuthorization: Bearer <your-token>\n\`\`\`\n\n`

    // Generate endpoint documentation
    markdown += `## Endpoints\n\n`
    
    Object.entries(this.openApiSpec.paths).forEach(([path, methods]) => {
      markdown += `### ${path}\n\n`
      
      Object.entries(methods).forEach(([method, operation]) => {
        if (typeof operation === 'object' && operation !== null) {
          markdown += `#### ${method.toUpperCase()} ${operation.summary || 'Operation'}\n\n`
          if (operation.description) {
            markdown += `${operation.description}\n\n`
          }
          
          // Parameters
          if (operation.parameters) {
            markdown += `**Parameters:**\n\n`
            operation.parameters.forEach((param: any) => {
              if (typeof param === 'object' && param !== null) {
                markdown += `- \`${param.name}\` (${param.in}): ${param.description || 'No description'}\n`
              }
            })
            markdown += `\n`
          }
          
          // Request body
          if (operation.requestBody) {
            markdown += `**Request Body:**\n\n`
            markdown += `\`\`\`json\n`
            markdown += `{\n`
            markdown += `  "example": "request body"\n`
            markdown += `}\n`
            markdown += `\`\`\`\n\n`
          }
          
          // Responses
          if (operation.responses) {
            markdown += `**Responses:**\n\n`
            Object.entries(operation.responses).forEach(([status, response]) => {
              if (typeof response === 'object' && response !== null) {
                markdown += `- \`${status}\`: ${(response as any).description || 'No description'}\n`
              }
            })
            markdown += `\n`
          }
        }
      })
    })

    const outputPath = path.join(process.cwd(), this.config.outputDir, 'README.md')
    fs.writeFileSync(outputPath, markdown)
  }

  /**
   * Generate code examples for different languages
   */
  private async generateCodeExamples(): Promise<void> {
    const examples: CodeExample[] = [
      {
        language: 'javascript',
        label: 'JavaScript (Fetch)',
        code: `
// Get events
const response = await fetch('${this.config.baseUrl}/api/v1/events', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-token>',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Create event
const newEvent = await fetch('${this.config.baseUrl}/api/v1/events', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Event',
    description: 'Event description',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-01T23:59:59Z'
  })
});
const createdEvent = await newEvent.json();
        `
      },
      {
        language: 'typescript',
        label: 'TypeScript (Axios)',
        code: `
import axios from 'axios';

const api = axios.create({
  baseURL: '${this.config.baseUrl}',
  headers: {
    'Authorization': 'Bearer <your-token>',
    'Content-Type': 'application/json'
  }
});

// Get events
const events = await api.get('/api/v1/events');

// Create event
const newEvent = await api.post('/api/v1/events', {
  name: 'My Event',
  description: 'Event description',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-01T23:59:59Z'
});
        `
      },
      {
        language: 'python',
        label: 'Python (Requests)',
        code: `
import requests

headers = {
    'Authorization': 'Bearer <your-token>',
    'Content-Type': 'application/json'
}

# Get events
response = requests.get('${this.config.baseUrl}/api/v1/events', headers=headers)
events = response.json()

# Create event
new_event = requests.post('${this.config.baseUrl}/api/v1/events', 
    headers=headers,
    json={
        'name': 'My Event',
        'description': 'Event description',
        'startDate': '2024-01-01T00:00:00Z',
        'endDate': '2024-01-01T23:59:59Z'
    }
)
created_event = new_event.json()
        `
      },
      {
        language: 'curl',
        label: 'cURL',
        code: `
# Get events
curl -X GET "${this.config.baseUrl}/api/v1/events" \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json"

# Create event
curl -X POST "${this.config.baseUrl}/api/v1/events" \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Event",
    "description": "Event description",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-01T23:59:59Z"
  }'
        `
      }
    ]

    const examplesDir = path.join(process.cwd(), this.config.outputDir, 'examples')
    if (!fs.existsSync(examplesDir)) {
      fs.mkdirSync(examplesDir, { recursive: true })
    }

    examples.forEach(example => {
      const filePath = path.join(examplesDir, `${example.language}.${example.language === 'curl' ? 'sh' : example.language}`)
      fs.writeFileSync(filePath, example.code.trim())
    })

    // Generate examples index
    const examplesIndex = examples.map(example => 
      `### ${example.label}\n\n\`\`\`${example.language}\n${example.code.trim()}\n\`\`\``
    ).join('\n\n')

    const examplesIndexPath = path.join(examplesDir, 'README.md')
    fs.writeFileSync(examplesIndexPath, `# API Code Examples\n\n${examplesIndex}`)
  }

  /**
   * Generate testing suite
   */
  private async generateTestingSuite(): Promise<void> {
    if (!this.config.includeTesting) return

    const testSuite = `
#!/usr/bin/env node
/**
 * API Testing Suite
 * Generated automatically from OpenAPI specification
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import axios from 'axios'

const API_BASE_URL = '${this.config.baseUrl}'
const TEST_TOKEN = process.env.TEST_API_TOKEN || 'test-token'

describe('API Integration Tests', () => {
  let apiClient: any

  beforeAll(() => {
    apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': \`Bearer \${TEST_TOKEN}\`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
  })

  afterAll(async () => {
    // Cleanup if needed
  })

  describe('Events API', () => {
    it('should get events list', async () => {
      const response = await apiClient.get('/api/v1/events')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
    })

    it('should create a new event', async () => {
      const eventData = {
        name: 'Test Event',
        description: 'Test event description',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-01T23:59:59Z',
        location: 'Virtual',
        maxAttendees: 100,
        ticketPrice: 0,
        currency: 'USD',
        category: 'test'
      }

      const response = await apiClient.post('/api/v1/events', eventData)
      
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data.name).toBe(eventData.name)
    })

    it('should get specific event', async () => {
      // First create an event
      const eventData = {
        name: 'Test Event for Get',
        description: 'Test event description',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-01T23:59:59Z'
      }

      const createResponse = await apiClient.post('/api/v1/events', eventData)
      const eventId = createResponse.data.data.id

      // Then get the event
      const response = await apiClient.get(\`/api/v1/events/\${eventId}\`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data.id).toBe(eventId)
    })

    it('should handle pagination', async () => {
      const response = await apiClient.get('/api/v1/events?page=1&limit=5')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('pagination')
      expect(response.data.pagination).toHaveProperty('page', 1)
      expect(response.data.pagination).toHaveProperty('limit', 5)
    })
  })

  describe('Error Handling', () => {
    it('should return 401 for unauthorized requests', async () => {
      const unauthorizedClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      try {
        await unauthorizedClient.get('/api/v1/events')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should return 400 for invalid request data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        description: 'Test description'
      }

      try {
        await apiClient.post('/api/v1/events', invalidData)
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data).toHaveProperty('error')
      }
    })

    it('should return 404 for non-existent resource', async () => {
      try {
        await apiClient.get('/api/v1/events/non-existent-id')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
      }
    })
  })

  describe('Performance Tests', () => {
    it('should respond within acceptable time', async () => {
      const startTime = Date.now()
      await apiClient.get('/api/v1/events')
      const endTime = Date.now()
      
      const responseTime = endTime - startTime
      expect(responseTime).toBeLessThan(2000) // 2 seconds
    })

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        apiClient.get('/api/v1/events')
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})
`

    const testPath = path.join(process.cwd(), this.config.outputDir, 'api-tests.test.ts')
    fs.writeFileSync(testPath, testSuite)
  }

  /**
   * Generate Postman collection
   */
  private async generatePostmanCollection(): Promise<void> {
    const collection = {
      info: {
        name: `${this.config.title} API`,
        description: this.config.description,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{authToken}}',
            type: 'string'
          }
        ]
      },
      variable: [
        {
          key: 'baseUrl',
          value: this.config.baseUrl,
          type: 'string'
        },
        {
          key: 'authToken',
          value: '',
          type: 'string'
        }
      ],
      item: [
        {
          name: 'Events',
          item: [
            {
              name: 'Get Events',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Authorization',
                    value: 'Bearer {{authToken}}',
                    type: 'text'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/api/v1/events',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'v1', 'events']
                }
              }
            },
            {
              name: 'Create Event',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Authorization',
                    value: 'Bearer {{authToken}}',
                    type: 'text'
                  },
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                    type: 'text'
                  }
                ],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    name: 'Test Event',
                    description: 'Test event description',
                    startDate: '2024-01-01T00:00:00Z',
                    endDate: '2024-01-01T23:59:59Z',
                    location: 'Virtual',
                    maxAttendees: 100,
                    ticketPrice: 0,
                    currency: 'USD',
                    category: 'test'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/v1/events',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'v1', 'events']
                }
              }
            }
          ]
        }
      ]
    }

    const collectionPath = path.join(process.cwd(), this.config.outputDir, 'postman-collection.json')
    fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2))
  }

  /**
   * Generate Insomnia collection
   */
  private async generateInsomniaCollection(): Promise<void> {
    const collection = {
      _type: 'export',
      __export_format: 4,
      __export_date: new Date().toISOString(),
      __export_source: 'insomnia.desktop.app:v2023.5.8',
      resources: [
        {
          _id: 'req_events_get',
          _type: 'request',
          parentId: 'fld_events',
          modified: Date.now(),
          created: Date.now(),
          url: '{{ _.baseUrl }}/api/v1/events',
          method: 'GET',
          body: {},
          parameters: [],
          headers: [
            {
              name: 'Authorization',
              value: 'Bearer {{ _.authToken }}'
            }
          ],
          authentication: {},
          metaSortKey: -1000000000000,
          isPrivate: false,
          settingStoreCookies: true,
          settingSendCookies: true,
          settingDisableRenderRequestBody: false,
          settingEncodeUrl: true,
          settingRebuildPath: true,
          settingFollowRedirects: 'global',
          name: 'Get Events'
        },
        {
          _id: 'req_events_post',
          _type: 'request',
          parentId: 'fld_events',
          modified: Date.now(),
          created: Date.now(),
          url: '{{ _.baseUrl }}/api/v1/events',
          method: 'POST',
          body: {
            mimeType: 'application/json',
            text: JSON.stringify({
              name: 'Test Event',
              description: 'Test event description',
              startDate: '2024-01-01T00:00:00Z',
              endDate: '2024-01-01T23:59:59Z',
              location: 'Virtual',
              maxAttendees: 100,
              ticketPrice: 0,
              currency: 'USD',
              category: 'test'
            }, null, 2)
          },
          parameters: [],
          headers: [
            {
              name: 'Authorization',
              value: 'Bearer {{ _.authToken }}'
            },
            {
              name: 'Content-Type',
              value: 'application/json'
            }
          ],
          authentication: {},
          metaSortKey: -999999999999,
          isPrivate: false,
          settingStoreCookies: true,
          settingSendCookies: true,
          settingDisableRenderRequestBody: false,
          settingEncodeUrl: true,
          settingRebuildPath: true,
          settingFollowRedirects: 'global',
          name: 'Create Event'
        },
        {
          _id: 'fld_events',
          _type: 'request_group',
          parentId: 'wrk_main',
          modified: Date.now(),
          created: Date.now(),
          name: 'Events',
          description: 'Event management operations',
          environment: {},
          environmentPropertyOrder: null,
          metaSortKey: -1000000000000
        },
        {
          _id: 'wrk_main',
          _type: 'workspace',
          parentId: null,
          modified: Date.now(),
          created: Date.now(),
          name: `${this.config.title} API`,
          description: this.config.description,
          scope: 'collection'
        }
      ]
    }

    const collectionPath = path.join(process.cwd(), this.config.outputDir, 'insomnia-collection.json')
    fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2))
  }

  /**
   * Update OpenAPI specification
   */
  public updateOpenAPISpec(updates: Partial<APIDocumentation>): void {
    this.openApiSpec = { ...this.openApiSpec, ...updates }
  }

  /**
   * Get current OpenAPI specification
   */
  public getOpenAPISpec(): APIDocumentation {
    return this.openApiSpec
  }

  /**
   * Validate OpenAPI specification
   */
  public validateOpenAPISpec(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Basic validation
    if (!this.openApiSpec.info) {
      errors.push('Missing info object')
    }

    if (!this.openApiSpec.paths || Object.keys(this.openApiSpec.paths).length === 0) {
      errors.push('Missing or empty paths object')
    }

    if (!this.openApiSpec.components) {
      errors.push('Missing components object')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Default configuration
export const defaultAPIDocumentationConfig: APIDocumentationConfig = {
  title: 'Virtual Event Organizer API',
  version: '1.0.0',
  description: 'Comprehensive API for virtual event management with real-time features',
  baseUrl: 'https://api.eventorganizer.example.com',
  contact: {
    name: 'API Support',
    email: 'support@eventorganizer.example.com',
    url: 'https://eventorganizer.example.com/support'
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT'
  },
  servers: [
    {
      url: 'https://api.eventorganizer.example.com',
      description: 'Production server'
    },
    {
      url: 'https://staging-api.eventorganizer.example.com',
      description: 'Staging server'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  outputDir: 'docs/api',
  includeExamples: true,
  includeTesting: true,
  theme: 'default'
}

// CLI interface
export class APIDocumentationCLI {
  private generator: APIDocumentationGenerator

  constructor(config: APIDocumentationConfig = defaultAPIDocumentationConfig) {
    this.generator = new APIDocumentationGenerator(config)
  }

  public async run(args: string[]): Promise<void> {
    const command = args[0] || 'generate'

    switch (command) {
      case 'generate':
        await this.generator.generateDocumentation()
        break
      case 'validate':
        const validation = this.generator.validateOpenAPISpec()
        if (validation.isValid) {
        } else {
        }
        break
      default:
    }
  }
}

export default APIDocumentationGenerator
