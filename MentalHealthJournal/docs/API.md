# API Documentation

## Overview

The Mental Health Journal App provides a comprehensive API for mood tracking, user management, and data analytics. The API is designed with privacy-first principles and follows RESTful conventions.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.moodtracker.app`

## Authentication

The API uses JWT-based authentication with secure token management.

### Headers

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## Core Endpoints

### Mood Entries

#### Create Mood Entry

```http
POST /api/mood-entries
```

**Request Body:**
```json
{
  "rating": 8,
  "notes": "Had a great day at work!",
  "entryDate": "2025-01-28",
  "tags": ["work", "productive"],
  "metadata": {
    "weather": "sunny",
    "sleepHours": 8
  }
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "rating": 8,
  "notes": "Had a great day at work!",
  "entryDate": "2025-01-28",
  "createdAt": "2025-01-28T10:30:00Z",
  "updatedAt": "2025-01-28T10:30:00Z",
  "status": "active",
  "tags": ["work", "productive"],
  "metadata": {
    "weather": "sunny",
    "sleepHours": 8
  }
}
```

#### Get Mood Entries

```http
GET /api/mood-entries?startDate=2025-01-01&endDate=2025-01-31&limit=50&offset=0
```

**Query Parameters:**
- `startDate` (optional): Start date filter (ISO 8601)
- `endDate` (optional): End date filter (ISO 8601)
- `limit` (optional): Number of entries to return (default: 50, max: 100)
- `offset` (optional): Number of entries to skip (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-123",
      "rating": 8,
      "notes": "Had a great day at work!",
      "entryDate": "2025-01-28",
      "createdAt": "2025-01-28T10:30:00Z",
      "updatedAt": "2025-01-28T10:30:00Z",
      "status": "active",
      "tags": ["work", "productive"],
      "metadata": {
        "weather": "sunny",
        "sleepHours": 8
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Get Single Mood Entry

```http
GET /api/mood-entries/{id}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "rating": 8,
  "notes": "Had a great day at work!",
  "entryDate": "2025-01-28",
  "createdAt": "2025-01-28T10:30:00Z",
  "updatedAt": "2025-01-28T10:30:00Z",
  "status": "active",
  "tags": ["work", "productive"],
  "metadata": {
    "weather": "sunny",
    "sleepHours": 8
  }
}
```

#### Update Mood Entry

```http
PUT /api/mood-entries/{id}
```

**Request Body:**
```json
{
  "rating": 9,
  "notes": "Updated: Even better day!",
  "tags": ["work", "productive", "celebration"]
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "rating": 9,
  "notes": "Updated: Even better day!",
  "entryDate": "2025-01-28",
  "createdAt": "2025-01-28T10:30:00Z",
  "updatedAt": "2025-01-28T11:45:00Z",
  "status": "active",
  "tags": ["work", "productive", "celebration"],
  "metadata": {
    "weather": "sunny",
    "sleepHours": 8
  }
}
```

#### Delete Mood Entry

```http
DELETE /api/mood-entries/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Mood entry deleted successfully"
}
```

### Analytics

#### Get Mood Statistics

```http
GET /api/analytics/mood-stats?period=30d&startDate=2025-01-01&endDate=2025-01-31
```

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y, custom)
- `startDate` (optional): Start date for custom period
- `endDate` (optional): End date for custom period

**Response:**
```json
{
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "days": 31
  },
  "statistics": {
    "averageRating": 7.2,
    "medianRating": 7,
    "minRating": 3,
    "maxRating": 10,
    "totalEntries": 28,
    "completionRate": 0.9
  },
  "trends": {
    "weeklyAverage": [6.8, 7.1, 7.5, 7.2, 7.0, 7.3, 7.4],
    "improvement": 0.6,
    "volatility": 1.2
  },
  "insights": [
    "Your mood tends to be higher on weekends",
    "Work-related entries show consistent patterns",
    "Weather correlation detected"
  ]
}
```

#### Get Mood Trends

```http
GET /api/analytics/trends?period=30d&granularity=day
```

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d, 1y)
- `granularity` (optional): Data granularity (day, week, month)

**Response:**
```json
{
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "granularity": "day"
  },
  "data": [
    {
      "date": "2025-01-01",
      "averageRating": 7.0,
      "entryCount": 1,
      "tags": ["work"]
    },
    {
      "date": "2025-01-02",
      "averageRating": 8.0,
      "entryCount": 1,
      "tags": ["weekend", "family"]
    }
  ],
  "summary": {
    "totalDays": 31,
    "daysWithEntries": 28,
    "averageRating": 7.2,
    "trendDirection": "improving"
  }
}
```

### User Management

#### Get User Profile

```http
GET /api/user/profile
```

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "username": "moodtracker_user",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-28T10:30:00Z",
  "preferences": {
    "theme": "light",
    "language": "en",
    "timezone": "UTC",
    "dateFormat": "YYYY-MM-DD"
  }
}
```

#### Update User Profile

```http
PUT /api/user/profile
```

**Request Body:**
```json
{
  "username": "new_username",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "timezone": "America/New_York"
  }
}
```

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "username": "new_username",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-28T11:45:00Z",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "timezone": "America/New_York",
    "dateFormat": "YYYY-MM-DD"
  }
}
```

### Settings

#### Get User Settings

```http
GET /api/user/settings
```

**Response:**
```json
{
  "userId": "user-123",
  "theme": "light",
  "language": "en",
  "timezone": "UTC",
  "dateFormat": "YYYY-MM-DD",
  "weekStartsOn": 0,
  "defaultChartPeriod": "month",
  "enableNotifications": false,
  "notificationTime": null,
  "dataRetentionDays": 365,
  "exportFormat": "json",
  "updatedAt": "2025-01-28T10:30:00Z"
}
```

#### Update User Settings

```http
PUT /api/user/settings
```

**Request Body:**
```json
{
  "theme": "dark",
  "language": "en",
  "timezone": "America/New_York",
  "enableNotifications": true,
  "notificationTime": "09:00",
  "dataRetentionDays": 730
}
```

**Response:**
```json
{
  "userId": "user-123",
  "theme": "dark",
  "language": "en",
  "timezone": "America/New_York",
  "dateFormat": "YYYY-MM-DD",
  "weekStartsOn": 0,
  "defaultChartPeriod": "month",
  "enableNotifications": true,
  "notificationTime": "09:00",
  "dataRetentionDays": 730,
  "exportFormat": "json",
  "updatedAt": "2025-01-28T11:45:00Z"
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid rating value",
    "details": {
      "field": "rating",
      "value": 15,
      "constraint": "Rating must be between 1 and 10"
    },
    "timestamp": "2025-01-28T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_REQUIRED` | Missing or invalid authentication |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `DUPLICATE_ENTRY` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## Rate Limiting

- **General API**: 1000 requests per hour per user
- **Analytics**: 100 requests per hour per user
- **Bulk Operations**: 10 requests per hour per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Mood Entry Created

```http
POST /webhooks/mood-entry-created
```

**Payload:**
```json
{
  "event": "mood.entry.created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "rating": 8,
    "entryDate": "2025-01-28",
    "createdAt": "2025-01-28T10:30:00Z"
  },
  "timestamp": "2025-01-28T10:30:00Z"
}
```

### User Settings Updated

```http
POST /webhooks/user-settings-updated
```

**Payload:**
```json
{
  "event": "user.settings.updated",
  "data": {
    "userId": "user-123",
    "changes": ["theme", "timezone"],
    "updatedAt": "2025-01-28T11:45:00Z"
  },
  "timestamp": "2025-01-28T11:45:00Z"
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @moodtracker/api-client
```

```typescript
import { MoodApiClient } from '@moodtracker/api-client';

const client = new MoodApiClient({
  baseUrl: 'https://api.moodtracker.app',
  apiKey: 'your-api-key'
});

// Create a mood entry
const entry = await client.moodEntries.create({
  rating: 8,
  notes: 'Great day!',
  entryDate: '2025-01-28'
});

// Get mood statistics
const stats = await client.analytics.getMoodStats({
  period: '30d'
});
```

### Python

```bash
pip install moodtracker-api
```

```python
from moodtracker_api import MoodApiClient

client = MoodApiClient(
    base_url='https://api.moodtracker.app',
    api_key='your-api-key'
)

# Create a mood entry
entry = client.mood_entries.create(
    rating=8,
    notes='Great day!',
    entry_date='2025-01-28'
)

# Get mood statistics
stats = client.analytics.get_mood_stats(period='30d')
```

## Testing

### Postman Collection

Import our Postman collection for easy API testing:
[Download Collection](https://api.moodtracker.app/docs/postman-collection.json)

### API Testing

```bash
# Test all endpoints
npm run test:api

# Test specific endpoint
npm run test:api -- --grep "mood-entries"
```

## Support

- **API Documentation**: [api.moodtracker.app/docs](https://api.moodtracker.app/docs)
- **Status Page**: [status.moodtracker.app](https://status.moodtracker.app)
- **Support Email**: api-support@moodtracker.app
- **GitHub Issues**: [github.com/moodtracker/api/issues](https://github.com/moodtracker/api/issues)
