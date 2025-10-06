# Collaborative Whiteboard API Documentation

## Overview

The Collaborative Whiteboard API provides a comprehensive RESTful interface for real-time collaborative drawing and sticky note functionality. Built with Next.js App Router, Supabase, and TypeScript, it offers seamless integration with modern web applications.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Real-time Events](#real-time-events)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Platform-Specific Features](#platform-specific-features)
- [SDKs and Examples](#sdks-and-examples)
- [Changelog](#changelog)

## Getting Started

### Base URL

```
Production: https://api.whiteboard.app/v1
Staging: https://staging-api.whiteboard.app/v1
Development: http://localhost:3000/api/v1
```

### Quick Start

1. **Get an API Key**: Sign up at [whiteboard.app](https://whiteboard.app) to get your API key
2. **Make your first request**:

```bash
curl -X GET "https://api.whiteboard.app/v1/whiteboards" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

3. **Create a whiteboard**:

```bash
curl -X POST "https://api.whiteboard.app/v1/whiteboards" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Whiteboard",
    "settings": {
      "width": 1920,
      "height": 1080,
      "background_color": "#FFFFFF"
    }
  }'
```

## Authentication

All API requests require authentication via JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. **Sign up** for an account at [whiteboard.app](https://whiteboard.app)
2. **Login** to get your JWT token
3. **Include the token** in all API requests

### Token Refresh

Tokens expire after 24 hours. Use the refresh endpoint to get a new token:

```bash
curl -X POST "https://api.whiteboard.app/v1/auth/refresh" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

## API Endpoints

### Whiteboards

#### List Whiteboards
```http
GET /api/v1/whiteboards
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search term for whiteboard names

**Response:**
```json
{
  "success": true,
  "data": {
    "whiteboards": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Project Planning Board",
        "settings": {
          "width": 1920,
          "height": 1080,
          "background_color": "#FFFFFF",
          "grid_enabled": true,
          "grid_size": 20
        },
        "drawing_count": 15,
        "sticky_note_count": 8,
        "created_at": "2023-12-01T10:00:00Z",
        "updated_at": "2023-12-01T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  },
  "timestamp": "2023-12-01T15:30:00Z"
}
```

#### Create Whiteboard
```http
POST /api/v1/whiteboards
```

**Request Body:**
```json
{
  "name": "My Whiteboard",
  "settings": {
    "width": 1920,
    "height": 1080,
    "background_color": "#FFFFFF",
    "grid_enabled": true,
    "grid_size": 20
  }
}
```

#### Get Whiteboard
```http
GET /api/v1/whiteboards/{id}
```

**Query Parameters:**
- `include_inactive` (optional): Include inactive drawings and sticky notes (default: false)

#### Update Whiteboard
```http
PUT /api/v1/whiteboards/{id}
```

**Request Body:**
```json
{
  "name": "Updated Whiteboard Name",
  "settings": {
    "width": 2560,
    "height": 1440,
    "background_color": "#F0F0F0"
  }
}
```

#### Delete Whiteboard
```http
DELETE /api/v1/whiteboards/{id}
```

### Drawings

#### List Drawings
```http
GET /api/v1/whiteboards/{id}/drawings
```

**Query Parameters:**
- `tool` (optional): Filter by drawing tool (`pen`, `brush`, `eraser`)
- `user_id` (optional): Filter by user ID

#### Create Drawing
```http
POST /api/v1/whiteboards/{id}/drawings
```

**Request Body:**
```json
{
  "tool": "pen",
  "color": "#FF0000",
  "size": 2,
  "points": [
    { "x": 100, "y": 100 },
    { "x": 200, "y": 200 }
  ],
  "user_id": "123e4567-e89b-12d3-a456-426614174002"
}
```

#### Update Drawing
```http
PUT /api/v1/whiteboards/{id}/drawings/{drawingId}
```

**Request Body:**
```json
{
  "tool": "brush",
  "color": "#00FF00",
  "size": 3,
  "points": [
    { "x": 100, "y": 100 },
    { "x": 200, "y": 200 },
    { "x": 300, "y": 300 }
  ]
}
```

#### Delete Drawing
```http
DELETE /api/v1/whiteboards/{id}/drawings/{drawingId}
```

### Sticky Notes

#### List Sticky Notes
```http
GET /api/v1/whiteboards/{id}/sticky-notes
```

**Query Parameters:**
- `user_id` (optional): Filter by user ID

#### Create Sticky Note
```http
POST /api/v1/whiteboards/{id}/sticky-notes
```

**Request Body:**
```json
{
  "content": "Remember to review the design mockups",
  "position": { "x": 100, "y": 100 },
  "color": "#FFE066",
  "user_id": "123e4567-e89b-12d3-a456-426614174002"
}
```

#### Update Sticky Note
```http
PUT /api/v1/whiteboards/{id}/sticky-notes/{noteId}
```

**Request Body:**
```json
{
  "content": "Updated: Remember to review the design mockups",
  "position": { "x": 200, "y": 200 },
  "color": "#FFB366"
}
```

#### Delete Sticky Note
```http
DELETE /api/v1/whiteboards/{id}/sticky-notes/{noteId}
```

### Users

#### Get Active Users
```http
GET /api/v1/whiteboards/{id}/users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "display_name": "John Doe",
      "last_seen": "2023-12-01T15:30:00Z",
      "cursor_position": { "x": 100, "y": 100 },
      "whiteboard_id": "123e4567-e89b-12d3-a456-426614174000",
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T15:30:00Z"
    }
  ],
  "timestamp": "2023-12-01T15:30:00Z"
}
```

### Whiteboard Management

#### Clear Whiteboard
```http
POST /api/v1/whiteboards/{id}/clear
```

**Request Body:**
```json
{
  "confirm": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cleared_drawings": 15,
    "cleared_sticky_notes": 8
  },
  "timestamp": "2023-12-01T15:30:00Z"
}
```

## Data Models

### Whiteboard

```typescript
interface Whiteboard {
  id: string;                    // UUID
  name: string;                  // Max 100 characters
  settings: WhiteboardSettings;
  drawings: Drawing[];
  sticky_notes: StickyNote[];
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

### WhiteboardSettings

```typescript
interface WhiteboardSettings {
  width: number;                 // 800-4000 pixels
  height: number;                // 600-3000 pixels
  background_color: string;      // Hex color (#FFFFFF)
  grid_enabled: boolean;
  grid_size: number;             // 10-100 pixels
}
```

### Drawing

```typescript
interface Drawing {
  id: string;                    // UUID
  tool: 'pen' | 'brush' | 'eraser';
  color: string;                 // Hex color (#FF0000)
  size: number;                  // 1-50 pixels
  points: Point[];
  user_id: string;               // UUID
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

### StickyNote

```typescript
interface StickyNote {
  id: string;                    // UUID
  content: string;               // Max 500 characters
  position: Position;
  color: string;                 // Hex color (#FFE066)
  user_id: string;               // UUID
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

### User

```typescript
interface User {
  id: string;                    // UUID
  display_name: string;          // Max 50 characters
  last_seen: string;             // ISO 8601 timestamp
  cursor_position?: Position;
  whiteboard_id?: string;        // UUID
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

### Point

```typescript
interface Point {
  x: number;
  y: number;
}
```

### Position

```typescript
interface Position {
  x: number;                     // >= 0
  y: number;                     // >= 0
}
```

## Real-time Events

The API supports real-time updates via WebSocket connections. Subscribe to events to receive live updates when whiteboards are modified.

### Event Types

- `drawing` - Drawing created, updated, or deleted
- `sticky_note` - Sticky note created, updated, or deleted
- `user_presence` - User joined, left, or moved cursor
- `whiteboard_clear` - Whiteboard content cleared
- `whiteboard_update` - Whiteboard settings updated

### Event Structure

```typescript
interface RealtimeEvent {
  type: string;
  payload: any;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'CLEAR';
  timestamp: string;
}
```

### Example: Drawing Event

```json
{
  "type": "drawing",
  "payload": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "tool": "pen",
    "color": "#FF0000",
    "size": 2,
    "points": [{ "x": 100, "y": 100 }],
    "user_id": "123e4567-e89b-12d3-a456-426614174002",
    "created_at": "2023-12-01T10:00:00Z",
    "updated_at": "2023-12-01T10:00:00Z"
  },
  "action": "INSERT",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### WebSocket Connection

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Subscribe to whiteboard changes
const channel = supabase
  .channel('whiteboard-123e4567-e89b-12d3-a456-426614174000')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'drawings',
    filter: 'whiteboard_id=eq.123e4567-e89b-12d3-a456-426614174000'
  }, (payload) => {
    console.log('Drawing changed:', payload)
  })
  .subscribe()
```

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "field_name",
    "message": "Field-specific error message"
  },
  "timestamp": "2023-12-01T15:30:00Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Common Errors

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "name",
    "message": "Name is required"
  },
  "timestamp": "2023-12-01T15:30:00Z"
}
```

#### Unauthorized
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "timestamp": "2023-12-01T15:30:00Z"
}
```

#### Rate Limited
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "details": {
    "retry_after": 60
  },
  "timestamp": "2023-12-01T15:30:00Z"
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **100 requests per minute** per user
- **1000 requests per hour** per IP address
- **10 requests per second** per user for real-time operations

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits

When rate limited, the API returns a 429 status with retry information:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "details": {
    "retry_after": 60
  },
  "timestamp": "2023-12-01T15:30:00Z"
}
```

## Platform-Specific Features

### Next.js App Router

The API is built with Next.js App Router and provides:

- **Server-side rendering** for improved performance
- **Middleware integration** for authentication and security
- **API route optimization** with automatic code splitting
- **Edge runtime support** for global distribution

### Supabase Integration

- **Real-time subscriptions** via Supabase Realtime
- **Row Level Security** for data protection
- **Automatic scaling** and high availability
- **Built-in authentication** and user management

### TypeScript Support

- **Full type definitions** for all API responses
- **Auto-generated types** from OpenAPI specification
- **IntelliSense support** in modern IDEs
- **Compile-time validation** for request/response data

## SDKs and Examples

### JavaScript/TypeScript SDK

```bash
npm install @whiteboard/api-client
```

```typescript
import { WhiteboardClient } from '@whiteboard/api-client'

const client = new WhiteboardClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.whiteboard.app/v1'
})

// Create a whiteboard
const whiteboard = await client.whiteboards.create({
  name: 'My Whiteboard',
  settings: {
    width: 1920,
    height: 1080
  }
})

// Add a drawing
const drawing = await client.drawings.create(whiteboard.id, {
  tool: 'pen',
  color: '#FF0000',
  size: 2,
  points: [{ x: 100, y: 100 }],
  user_id: 'user-id'
})

// Subscribe to real-time events
client.realtime.subscribe(whiteboard.id, (event) => {
  console.log('Real-time event:', event)
})
```

### React Hook

```typescript
import { useWhiteboard } from '@whiteboard/react-hooks'

function WhiteboardComponent({ whiteboardId }: { whiteboardId: string }) {
  const {
    whiteboard,
    drawings,
    stickyNotes,
    users,
    createDrawing,
    createStickyNote,
    isLoading,
    error
  } = useWhiteboard(whiteboardId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{whiteboard?.name}</h1>
      {/* Render whiteboard content */}
    </div>
  )
}
```

### Python SDK

```bash
pip install whiteboard-api
```

```python
from whiteboard import WhiteboardClient

client = WhiteboardClient(api_key='your-api-key')

# Create a whiteboard
whiteboard = client.whiteboards.create(
    name='My Whiteboard',
    settings={
        'width': 1920,
        'height': 1080,
        'background_color': '#FFFFFF'
    }
)

# Add a drawing
drawing = client.drawings.create(
    whiteboard_id=whiteboard.id,
    tool='pen',
    color='#FF0000',
    size=2,
    points=[{'x': 100, 'y': 100}],
    user_id='user-id'
)
```

### cURL Examples

#### Create Whiteboard
```bash
curl -X POST "https://api.whiteboard.app/v1/whiteboards" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Planning",
    "settings": {
      "width": 1920,
      "height": 1080,
      "background_color": "#FFFFFF",
      "grid_enabled": true,
      "grid_size": 20
    }
  }'
```

#### Add Drawing
```bash
curl -X POST "https://api.whiteboard.app/v1/whiteboards/123e4567-e89b-12d3-a456-426614174000/drawings" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "pen",
    "color": "#FF0000",
    "size": 2,
    "points": [
      { "x": 100, "y": 100 },
      { "x": 200, "y": 200 }
    ],
    "user_id": "123e4567-e89b-12d3-a456-426614174002"
  }'
```

#### Add Sticky Note
```bash
curl -X POST "https://api.whiteboard.app/v1/whiteboards/123e4567-e89b-12d3-a456-426614174000/sticky-notes" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Remember to review the design",
    "position": { "x": 100, "y": 100 },
    "color": "#FFE066",
    "user_id": "123e4567-e89b-12d3-a456-426614174002"
  }'
```

## Changelog

### v1.0.0 (2023-12-01)

#### Added
- Initial API release
- Whiteboard CRUD operations
- Drawing management
- Sticky note management
- User presence tracking
- Real-time WebSocket support
- Authentication and authorization
- Rate limiting
- Comprehensive error handling
- OpenAPI 3.0 specification
- TypeScript type definitions

#### Features
- RESTful API design
- Next.js App Router integration
- Supabase backend integration
- Real-time collaboration
- Cross-platform support
- Comprehensive documentation

---

For more information, visit [whiteboard.app/docs](https://whiteboard.app/docs) or contact support at [support@whiteboard.app](mailto:support@whiteboard.app).
