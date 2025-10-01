# Personal Shopping Assistant - User Guide

## 📖 Welcome to Personal Shopping Assistant

The Personal Shopping Assistant is an AI-powered API that helps you discover products tailored to your preferences and shopping behavior. This guide will help you get started and make the most of the service.

## 🚀 Getting Started

### What is Personal Shopping Assistant?

Personal Shopping Assistant is a smart API that:
- **Learns your preferences** from your interactions
- **Recommends products** based on your taste and behavior
- **Searches intelligently** across product catalogs
- **Tracks your interests** to improve recommendations over time

### Key Features

- 🎯 **Personalized Recommendations**: Get product suggestions tailored to your preferences
- 🔍 **Smart Search**: Find products using natural language queries
- 👤 **User Profiles**: Manage your preferences and shopping history
- 📊 **Analytics**: Track your shopping patterns and interests
- 🔒 **Secure**: Your data is protected with industry-standard security

## 🛠️ API Usage

### Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://your-app.vercel.app`

### Authentication
Most features require authentication. You'll get a JWT token when you register or login.

## 👤 User Management

### Creating an Account

#### Step 1: Register
```bash
curl -X POST http://localhost:3001/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-secure-password",
    "name": "Your Name",
    "preferences": {
      "categories": ["Electronics", "Clothing"],
      "priceRange": { "min": 0, "max": 1000 },
      "brands": ["Apple", "Nike"],
      "stylePreferences": ["Modern", "Casual"]
    }
  }'
```

#### Step 2: Login
```bash
curl -X POST http://localhost:3001/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-secure-password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "your-email@example.com",
      "name": "Your Name"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Managing Your Profile

#### View Your Profile
```bash
curl -X GET http://localhost:3001/api/v1/users/profile \
  -H "Authorization: Bearer <your-token>"
```

#### Update Your Preferences
```bash
curl -X PUT http://localhost:3001/api/v1/users/preferences \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["Electronics", "Books"],
    "priceRange": { "min": 100, "max": 500 },
    "brands": ["Samsung", "Sony"],
    "stylePreferences": ["Professional"]
  }'
```

## 🛍️ Product Discovery

### Browsing Products

#### Get All Products
```bash
curl -X GET "http://localhost:3001/api/v1/products?page=1&limit=20"
```

#### Search Products
```bash
curl -X GET "http://localhost:3001/api/v1/products/search?q=smartphone&category=Electronics&minPrice=100&maxPrice=1000"
```

**Search Parameters:**
- `q` - Search query (required)
- `category` - Filter by category
- `brand` - Filter by brand
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `page` - Page number
- `limit` - Items per page

#### Get Product Details
```bash
curl -X GET http://localhost:3001/api/v1/products/1
```

### Getting Recommendations

#### Personalized Recommendations
```bash
curl -X GET http://localhost:3001/api/v1/products/recommendations \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
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
        "score": 0.95,
        "reason": "Matches your Electronics preference and Apple brand preference"
      }
    ],
    "algorithm": "collaborative_filtering",
    "generatedAt": "2024-01-01T12:00:00Z"
  }
}
```

## 📊 Tracking Your Interests

### Product Interactions

#### Track Product Views
```bash
curl -X POST http://localhost:3001/api/v1/interactions/view \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "timestamp": "2024-01-01T12:00:00Z"
  }'
```

#### Track Product Likes
```bash
curl -X POST http://localhost:3001/api/v1/interactions/like \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "timestamp": "2024-01-01T12:00:00Z"
  }'
```

## 🔍 Search Tips

### Effective Search Queries

#### General Search
- **"smartphone"** - Find all smartphones
- **"laptop under 1000"** - Find laptops under $1000
- **"wireless headphones"** - Find wireless audio devices

#### Category-Specific Search
- **"Electronics"** - Browse electronics category
- **"Clothing"** - Browse clothing category
- **"Books"** - Browse books category

#### Brand-Specific Search
- **"Apple iPhone"** - Find Apple iPhones
- **"Nike shoes"** - Find Nike footwear
- **"Samsung Galaxy"** - Find Samsung Galaxy devices

### Advanced Search

#### Price Range Search
```bash
curl -X GET "http://localhost:3001/api/v1/products/search?q=laptop&minPrice=500&maxPrice=1500"
```

#### Multi-Category Search
```bash
curl -X GET "http://localhost:3001/api/v1/products/search?q=wireless&category=Electronics"
```

#### Brand + Category Search
```bash
curl -X GET "http://localhost:3001/api/v1/products/search?q=Apple&category=Electronics&brand=Apple"
```

## 📈 Understanding Recommendations

### How Recommendations Work

The Personal Shopping Assistant uses several algorithms to provide recommendations:

1. **Collaborative Filtering**: Finds users with similar preferences
2. **Content-Based Filtering**: Matches products to your preferences
3. **Hybrid Approach**: Combines multiple methods for better accuracy

### Improving Recommendations

#### 1. Complete Your Profile
- Fill out all preference categories
- Set accurate price ranges
- Add preferred brands and styles

#### 2. Interact with Products
- View products you're interested in
- Like products you enjoy
- The more you interact, the better the recommendations

#### 3. Update Preferences Regularly
- Adjust categories as your interests change
- Update price ranges based on your budget
- Add new brands you discover

### Recommendation Scores

Recommendations include a score (0-1) indicating how well they match your preferences:
- **0.9-1.0**: Excellent match
- **0.7-0.9**: Good match
- **0.5-0.7**: Fair match
- **0.0-0.5**: Poor match

## 🔒 Privacy and Security

### Your Data
- **Email**: Used for authentication and account management
- **Preferences**: Used to generate recommendations
- **Interactions**: Used to improve recommendations
- **No Personal Data**: We don't store personal information beyond what you provide

### Security Features
- **Encrypted Passwords**: All passwords are securely hashed
- **JWT Tokens**: Secure authentication tokens
- **HTTPS**: All communication is encrypted
- **Rate Limiting**: Protection against abuse

### Data Control
- **Update Preferences**: Change your preferences anytime
- **Delete Account**: Contact support to delete your account
- **Data Export**: Request your data export

## 🚨 Error Handling

### Common Error Codes

#### 400 Bad Request
- Invalid input data
- Missing required fields
- Invalid data format

#### 401 Unauthorized
- Invalid or missing authentication token
- Expired token
- Invalid credentials

#### 404 Not Found
- Product not found
- User not found
- Endpoint not found

#### 409 Conflict
- Email already exists
- Duplicate resource

#### 429 Too Many Requests
- Rate limit exceeded
- Too many requests in a short time

### Error Response Format
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

## 📞 Support and Help

### Getting Help

#### Documentation
- **API Documentation**: Complete API reference
- **User Guide**: This guide
- **Examples**: Code examples and tutorials

#### Support Channels
- **GitHub Issues**: Report bugs and request features
- **Email Support**: support@example.com
- **Documentation**: Check the docs/ folder

### Common Issues

#### Authentication Problems
- **Invalid Token**: Re-login to get a new token
- **Expired Token**: Tokens expire after 24 hours
- **Missing Token**: Include Authorization header

#### Search Issues
- **No Results**: Try broader search terms
- **Slow Search**: Large result sets may take time
- **Invalid Parameters**: Check parameter format

#### Recommendation Issues
- **Poor Recommendations**: Update your preferences
- **No Recommendations**: Ensure you have preferences set
- **Outdated Recommendations**: Refresh your preferences

## 🎯 Best Practices

### For Developers

#### 1. Handle Errors Gracefully
```javascript
try {
  const response = await fetch('/api/v1/products');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
}
```

#### 2. Implement Caching
```javascript
// Cache recommendations for 5 minutes
const cacheKey = `recommendations_${userId}`;
const cached = localStorage.getItem(cacheKey);
if (cached && Date.now() - JSON.parse(cached).timestamp < 300000) {
  return JSON.parse(cached).data;
}
```

#### 3. Track User Interactions
```javascript
// Track product views
const trackView = async (productId) => {
  await fetch('/api/v1/interactions/view', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      productId,
      timestamp: new Date().toISOString()
    })
  });
};
```

### For Users

#### 1. Keep Preferences Updated
- Review and update preferences monthly
- Add new categories as interests change
- Adjust price ranges based on budget

#### 2. Interact with Products
- View products you're interested in
- Like products you enjoy
- The more you interact, the better recommendations

#### 3. Use Search Effectively
- Use specific terms for better results
- Combine search with filters
- Try different search terms if no results

## 🚀 Advanced Usage

### Batch Operations

#### Track Multiple Interactions
```bash
curl -X POST http://localhost:3001/api/v1/interactions/batch \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "interactions": [
      { "type": "view", "productId": 1 },
      { "type": "like", "productId": 2 },
      { "type": "view", "productId": 3 }
    ]
  }'
```

### Analytics

#### Get User Analytics
```bash
curl -X GET http://localhost:3001/api/v1/analytics/user \
  -H "Authorization: Bearer <your-token>"
```

## 📚 Examples

### Complete Shopping Workflow

#### 1. Register and Login
```bash
# Register
curl -X POST http://localhost:3001/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shopper@example.com",
    "password": "password123",
    "name": "Smart Shopper",
    "preferences": {
      "categories": ["Electronics"],
      "priceRange": { "min": 100, "max": 1000 },
      "brands": ["Apple", "Samsung"],
      "stylePreferences": ["Modern"]
    }
  }'

# Login
curl -X POST http://localhost:3001/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shopper@example.com",
    "password": "password123"
  }'
```

#### 2. Search for Products
```bash
curl -X GET "http://localhost:3001/api/v1/products/search?q=smartphone&category=Electronics"
```

#### 3. Get Recommendations
```bash
curl -X GET http://localhost:3001/api/v1/products/recommendations \
  -H "Authorization: Bearer <your-token>"
```

#### 4. Track Interactions
```bash
# View a product
curl -X POST http://localhost:3001/api/v1/interactions/view \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "timestamp": "2024-01-01T12:00:00Z"}'

# Like a product
curl -X POST http://localhost:3001/api/v1/interactions/like \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "timestamp": "2024-01-01T12:00:00Z"}'
```

---

**Happy Shopping! 🛍️**

For more information, check out the [API Documentation](API_DOCUMENTATION.md) or contact support.
