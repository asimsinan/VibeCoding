# Food Lens API Documentation

**Version**: 1.0.0  
**Last Updated**: 2025-01-27

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Examples](#requestresponse-examples)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

## Overview

The Food Lens API provides endpoints for:
- User authentication and registration
- Food label image scanning
- Nutrition information extraction
- Allergen detection
- Healthier alternative suggestions
- Scan history management

### Base URLs

- **Production**: `https://api.foodlens.app/v1`
- **Development**: `http://localhost:3000/v1`

### OpenAPI Specification

Complete API specification available in OpenAPI 3.0 format: `contracts/openapi.yaml`

## Authentication

### Overview

Food Lens uses Firebase Authentication for secure user authentication. All API endpoints (except public health information) require authentication.

### Authentication Flow

1. **Register**: Create a new user account
2. **Login**: Authenticate and receive Firebase tokens
3. **Use Tokens**: Include Firebase ID token in API requests

### Register Endpoint

**POST** `/auth/register`

Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "language": "en",
    "createdAt": "2025-01-27T10:00:00Z"
  },
  "token": "firebase-id-token",
  "refreshToken": "firebase-refresh-token",
  "expiresIn": "3600"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Password must be at least 8 characters"
  }
}
```

### Login Endpoint

**POST** `/auth/login`

Authenticate existing user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "token": "firebase-id-token",
  "refreshToken": "firebase-refresh-token",
  "expiresIn": "3600"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid credentials"
  }
}
```

### Using Authentication Tokens

Include the Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

## API Endpoints

### Scan Endpoints

#### Create Scan

**POST** `/scans`

Submit a food label image for processing.

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "language": "en"
}
```

**Response** (200 OK):
```json
{
  "scanId": "scan_1234567890_abc123",
  "status": "pending",
  "message": "Scan accepted for processing"
}
```

#### Get Scan Details

**GET** `/scans/{scanId}`

Retrieve processed scan results.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "scanId": "scan_1234567890_abc123",
  "status": "completed",
  "nutritionData": {
    "foodName": "Chocolate Chip Cookies",
    "brand": "Generic",
    "servingSize": "1 cookie (30g)",
    "calories": 150,
    "nutrients": {
      "protein": 2,
      "carbs": 20,
      "fat": 7,
      "fiber": 1,
      "sodium": 100,
      "sugar": 10
    }
  },
  "allergens": [
    {
      "name": "Wheat",
      "severity": "medium",
      "description": "Contains wheat"
    }
  ],
  "alternatives": [
    {
      "id": "alt_001",
      "name": "Oatmeal Raisin Cookies",
      "reason": "Lower sugar, higher fiber",
      "nutritionComparison": {
        "calories": { "current": 150, "alternative": 120, "difference": -30 }
      }
    }
  ]
}
```

#### Get Scan History

**GET** `/scans/history?page=1&limit=20`

Retrieve user's scan history with pagination.

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 50)

**Response** (200 OK):
```json
{
  "scans": [
    {
      "scanId": "scan_1234567890_abc123",
      "status": "completed",
      "createdAt": "2025-01-27T10:00:00Z",
      "nutritionData": {
        "foodName": "Chocolate Chip Cookies",
        "calories": 150
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

#### Delete Scan

**DELETE** `/scans/{scanId}`

Delete a scan from user's history.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Scan deleted successfully"
}
```

### AI Processing Endpoint

#### Process Image Directly

**POST** `/ai/process`

Direct AI processing endpoint (internal use, typically via scan service).

**Request Body**:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "type": "nutrition"
}
```

**Response** (200 OK):
```json
{
  "nutritionData": {
    "foodName": "Chocolate Chip Cookies",
    "calories": 150,
    "nutrients": {
      "protein": 2,
      "carbs": 20,
      "fat": 7
    }
  }
}
```

### Alternatives Endpoint

#### Get Healthier Alternatives

**GET** `/alternatives/{scanId}`

Get healthier alternative suggestions for a scanned food item.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "alternatives": [
    {
      "id": "alt_001",
      "name": "Oatmeal Raisin Cookies",
      "reason": "Lower sugar, higher fiber",
      "nutritionComparison": {
        "calories": { "current": 150, "alternative": 120, "difference": -30 },
        "sugar": { "current": 10, "alternative": 6, "difference": -4 },
        "fiber": { "current": 1, "alternative": 3, "difference": 2 }
      }
    }
  ]
}
```

## Request/Response Examples

### Complete Scan Flow

#### 1. Register User

```bash
curl -X POST https://api.foodlens.app/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "displayName": "John Doe"
  }'
```

#### 2. Login

```bash
curl -X POST https://api.foodlens.app/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

#### 3. Create Scan

```bash
curl -X POST https://api.foodlens.app/v1/scans \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "language": "en"
  }'
```

#### 4. Get Scan Results (Polling)

```bash
curl -X GET https://api.foodlens.app/v1/scans/scan_1234567890_abc123 \
  -H "Authorization: Bearer <token>"
```

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `AUTHENTICATION_ERROR` | 401 | Authentication required or invalid |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `PROCESSING_ERROR` | 500 | Internal processing error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Example Error Responses

#### Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Image size exceeds 10MB limit"
  }
}
```

#### Authentication Error

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication required"
  }
}
```

## Rate Limiting

### Limits

- **Authentication**: 10 requests per minute per IP
- **Scan Creation**: 50 scans per hour per user
- **Scan Retrieval**: 100 requests per minute per user
- **History**: 60 requests per minute per user

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642672800
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 3600
  }
}
```

## Additional Resources

- **OpenAPI Specification**: `contracts/openapi.yaml`
- **Authentication Guide**: See [Authentication](#authentication) section
- **Database Schema**: `docs/database-schema.md`
- **Firebase Setup**: `docs/FIREBASE_SETUP.md`

