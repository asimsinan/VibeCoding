# API Documentation

This directory contains comprehensive API documentation for the Kanban Project Management API.

## Overview

The Kanban Project Management API is a RESTful API built with Next.js 14+ and TypeScript, providing real-time collaboration features for project management.

## Quick Start

### 1. Generate OpenAPI Specification

```bash
# Generate YAML specification
npm run generate-openapi

# Generate JSON specification
npm run generate-openapi:json

# Generate with custom options
npm run generate-openapi -- --title "My API" --version "2.0.0" --output "my-api.yaml"
```

### 2. Generate Documentation

```bash
# Generate HTML documentation
npm run api-docs:html

# Generate Markdown documentation
npm run api-docs:markdown

# Generate JSON documentation
npm run api-docs:json

# Generate with custom options
npm run api-docs -- --input "contracts/openapi.yaml" --output "docs/api" --format html
```

### 3. View Interactive Documentation

Visit `/api-docs` in your browser to view the interactive API documentation.

## API Features

### Authentication
- JWT-based authentication
- Refresh token support
- Role-based access control

### Rate Limiting
- Configurable rate limits per endpoint
- Rate limit headers in responses
- Automatic retry logic

### CORS
- Configurable CORS policies
- Support for multiple origins
- Preflight request handling

### Security
- Security headers (CSP, HSTS, etc.)
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Versioning
- API versioning support
- Backward compatibility
- Deprecation warnings

### Error Handling
- Standardized error responses
- Detailed error messages
- Error logging and monitoring

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token

### Workspaces
- `GET /workspaces` - List workspaces
- `POST /workspaces` - Create workspace
- `GET /workspaces/{id}` - Get workspace
- `PUT /workspaces/{id}` - Update workspace
- `DELETE /workspaces/{id}` - Delete workspace

### Boards
- `GET /workspaces/{id}/boards` - List boards
- `POST /workspaces/{id}/boards` - Create board
- `GET /boards/{id}` - Get board
- `PUT /boards/{id}` - Update board
- `DELETE /boards/{id}` - Delete board

### Tasks
- `GET /boards/{id}/tasks` - List tasks
- `POST /boards/{id}/tasks` - Create task
- `GET /tasks/{id}` - Get task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task
- `PATCH /tasks/{id}/move` - Move task

### Users
- `GET /users/search` - Search users

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Workspace
```typescript
interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberCount: number;
  boardCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Board
```typescript
interface Board {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  columns: Column[];
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  boardId: string;
  columnId: string;
  assigneeId?: string;
  position: number;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  },
  "meta": {
    "timestamp": "2023-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "requestId": "req_1234567890"
  }
}
```

### Common Error Codes
- `BAD_REQUEST` - Invalid request parameters
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting

The API implements rate limiting to prevent abuse and ensure fair usage:

- **Global**: 1000 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes
- **API**: 100 requests per 15 minutes
- **Strict**: 5 requests per minute

Rate limit information is included in response headers:
- `RateLimit-Limit` - Request limit
- `RateLimit-Remaining` - Remaining requests
- `RateLimit-Reset` - Reset timestamp
- `Retry-After` - Seconds to wait (when limited)

## Authentication

### JWT Token
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Token Refresh
When the access token expires, use the refresh token to get a new one:
```json
POST /auth/refresh
{
  "refreshToken": "your-refresh-token"
}
```

## Pagination

List endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Pagination Response
```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Filtering and Sorting

### Task Filtering
- `columnId` - Filter by column
- `assigneeId` - Filter by assignee
- `status` - Filter by status
- `priority` - Filter by priority
- `search` - Search in title and description

### Sorting
- `sort` - Sort field (createdAt, updatedAt, name, title)
- `order` - Sort order (asc, desc)

## Real-time Updates

The API supports real-time updates using WebSockets:
- Task updates
- Board changes
- User presence
- Notifications

## Testing

### Run Tests
```bash
# Run all API tests
npm run test:api

# Run specific test types
npm run test:contract
npm run test:api:integration
npm run test:api:performance
npm run test:api:security
```

### Test Configuration
Configure tests using environment variables:
- `API_BASE_URL` - API base URL
- `ENABLE_PERFORMANCE_TESTS` - Enable performance tests
- `ENABLE_SECURITY_TESTS` - Enable security tests
- `ENABLE_INTEGRATION_TESTS` - Enable integration tests

## Development

### Local Development
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Generate OpenAPI specification:
   ```bash
   npm run generate-openapi
   ```

3. View API documentation:
   ```bash
   npm run api-docs:html
   ```

### API Client
Use the provided API client for easy integration:
```typescript
import { createApiClient } from './src/lib/api/client/apiClient';

const client = createApiClient({
  baseURL: 'https://api.kanban-app.com/v1'
});

// Set authentication
client.setTokens(accessToken, refreshToken);

// Make requests
const workspaces = await client.get('/workspaces');
```

## Contributing

1. Follow the API design principles
2. Update OpenAPI specification
3. Add comprehensive tests
4. Update documentation
5. Follow semantic versioning

## Support

For API support and questions:
- Email: support@kanban-app.com
- Documentation: https://kanban-app.com/docs
- Issues: https://github.com/kanban-app/api/issues
