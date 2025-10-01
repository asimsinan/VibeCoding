# Personal Shopping Assistant API Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)
- [SDKs](#sdks)

## 🔍 Overview

The Personal Shopping Assistant API provides intelligent product recommendations, user management, and search capabilities. It's designed to help users discover products that match their preferences and shopping behavior.

### Base URLs
- **Development**: `http://localhost:3001`
- **Production**: `https://your-app.vercel.app`

### API Version
Current version: `v1`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token
1. Register a new user or login with existing credentials
2. The API will return a JWT token in the response
3. Include this token in subsequent requests

### Token Expiration
- Tokens expire after 24 hours by default
- Refresh tokens are not currently implemented
- Re-login required after token expiration

## 🛠️ Endpoints

### Health Check

#### GET /health
Returns API health status and basic information.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

### User Management

#### POST /api/v1/users/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "preferences": {
    "categories": ["Electronics", "Clothing"],
    "priceRange": { "min": 0, "max": 1000 },
    "brands": ["Apple", "Nike"],
    "stylePreferences": ["Modern", "Casual"]
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T12:00:00Z"
    },
    "preferences": {
      "categories": ["Electronics", "Clothing"],
      "priceRange": { "min": 0, "max": 1000 },
      "brands": ["Apple", "Nike"],
      "stylePreferences": ["Modern", "Casual"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `409 Conflict` - Email already exists

#### POST /api/v1/users/login
Authenticate a user and return a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid credentials

#### GET /api/v1/users/profile
Get current user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T12:00:00Z"
    },
    "preferences": {
      "categories": ["Electronics", "Clothing"],
      "priceRange": { "min": 0, "max": 1000 },
      "brands": ["Apple", "Nike"],
      "stylePreferences": ["Modern", "Casual"]
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token

#### PUT /api/v1/users/preferences
Update user preferences.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "categories": ["Electronics", "Books"],
  "priceRange": { "min": 100, "max": 500 },
  "brands": ["Samsung", "Sony"],
  "stylePreferences": ["Professional"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": ["Electronics", "Books"],
    "priceRange": { "min": 100, "max": 500 },
    "brands": ["Samsung", "Sony"],
    "stylePreferences": ["Professional"],
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### Product Management

#### GET /api/v1/products
Get all products with optional filtering.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)
- `category` (optional) - Filter by category
- `brand` (optional) - Filter by brand
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter

**Example:**
```http
GET /api/v1/products?category=Electronics&minPrice=100&maxPrice=1000&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "iPhone 15 Pro",
        "description": "Latest iPhone with advanced features",
        "price": 999.99,
        "category": "Electronics",
        "brand": "Apple",
        "imageUrl": "https://example.com/iphone15.jpg",
        "availability": true,
        "style": "Modern",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

#### GET /api/v1/products/search
Search products by query string and filters.

**Query Parameters:**
- `q` (required) - Search query
- `category` (optional) - Filter by category
- `brand` (optional) - Filter by brand
- `minPrice` (optional) - Minimum price filter
- `maxPrice` (optional) - Maximum price filter
- `page` (optional) - Page number
- `limit` (optional) - Items per page

**Example:**
```http
GET /api/v1/products/search?q=smartphone&category=Electronics&minPrice=100&maxPrice=1000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "iPhone 15 Pro",
        "description": "Latest iPhone with advanced features",
        "price": 999.99,
        "category": "Electronics",
        "brand": "Apple",
        "imageUrl": "https://example.com/iphone15.jpg",
        "availability": true,
        "style": "Modern",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "query": "smartphone",
    "filters": {
      "category": "Electronics",
      "minPrice": 100,
      "maxPrice": 1000
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

#### GET /api/v1/products/:id
Get a specific product by ID.

**Path Parameters:**
- `id` (required) - Product ID

**Example:**
```http
GET /api/v1/products/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone with advanced features",
    "price": 999.99,
    "category": "Electronics",
    "brand": "Apple",
    "imageUrl": "https://example.com/iphone15.jpg",
    "availability": true,
    "style": "Modern",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Product not found

#### GET /api/v1/products/recommendations
Get personalized product recommendations for the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional) - Number of recommendations (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": 1,
        "name": "iPhone 15 Pro",
        "description": "Latest iPhone with advanced features",
        "price": 999.99,
        "category": "Electronics",
        "brand": "Apple",
        "imageUrl": "https://example.com/iphone15.jpg",
        "availability": true,
        "style": "Modern",
        "score": 0.95,
        "reason": "Matches your Electronics preference and Apple brand preference"
      }
    ],
    "algorithm": "collaborative_filtering",
    "generatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### User Interactions

#### POST /api/v1/interactions/view
Track when a user views a product.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": 1,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "interactionId": 1,
    "userId": 1,
    "productId": 1,
    "type": "view",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### POST /api/v1/interactions/like
Track when a user likes a product.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": 1,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "interactionId": 2,
    "userId": 1,
    "productId": 1,
    "type": "like",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## 📊 Data Models

### User
```typescript
interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

### User Preferences
```typescript
interface UserPreferences {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  brands: string[];
  stylePreferences: string[];
}
```

### Product
```typescript
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  imageUrl?: string;
  availability: boolean;
  style?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Interaction
```typescript
interface Interaction {
  id: number;
  userId: number;
  productId: number;
  type: 'view' | 'like' | 'purchase';
  timestamp: string;
}
```

## ❌ Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "status": 400,
    "timestamp": "2024-01-01T12:00:00Z",
    "path": "/api/v1/users/register",
    "method": "POST"
  }
}
```

### HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## ⚡ Rate Limiting

The API implements rate limiting to prevent abuse:

- **General Endpoints**: 100 requests per 15 minutes
- **Authentication Endpoints**: 10 requests per 15 minutes
- **Search Endpoints**: 50 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 💡 Examples

### Complete User Workflow

#### 1. Register User
```bash
curl -X POST http://localhost:3001/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "name": "John Doe",
    "preferences": {
      "categories": ["Electronics"],
      "priceRange": {"min": 100, "max": 1000},
      "brands": ["Apple", "Samsung"],
      "stylePreferences": ["Modern"]
    }
  }'
```

#### 2. Login User
```bash
curl -X POST http://localhost:3001/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### 3. Get Recommendations
```bash
curl -X GET http://localhost:3001/api/v1/products/recommendations \
  -H "Authorization: Bearer <your-token>"
```

#### 4. Search Products
```bash
curl -X GET "http://localhost:3001/api/v1/products/search?q=smartphone&category=Electronics"
```

#### 5. Track Product View
```bash
curl -X POST http://localhost:3001/api/v1/interactions/view \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "timestamp": "2024-01-01T12:00:00Z"
  }'
```

## 🔧 SDKs

### JavaScript/Node.js
```javascript
const api = new PersonalShoppingAPI('http://localhost:3001');

// Register user
const user = await api.users.register({
  email: 'john@example.com',
  password: 'password123',
  name: 'John Doe',
  preferences: {
    categories: ['Electronics'],
    priceRange: { min: 100, max: 1000 },
    brands: ['Apple'],
    stylePreferences: ['Modern']
  }
});

// Get recommendations
const recommendations = await api.products.getRecommendations();
```

### Python
```python
from personal_shopping_api import PersonalShoppingAPI

api = PersonalShoppingAPI('http://localhost:3001')

# Register user
user = api.users.register(
    email='john@example.com',
    password='password123',
    name='John Doe',
    preferences={
        'categories': ['Electronics'],
        'priceRange': {'min': 100, 'max': 1000},
        'brands': ['Apple'],
        'stylePreferences': ['Modern']
    }
)

# Get recommendations
recommendations = api.products.get_recommendations()
```

## 📞 Support

For API support and questions:
- **Documentation**: Check this documentation
- **Issues**: Create a GitHub issue
- **Email**: api-support@example.com

---

**API Version**: 1.0.0  
**Last Updated**: 2024-01-01  
**Documentation Version**: 1.0.0
