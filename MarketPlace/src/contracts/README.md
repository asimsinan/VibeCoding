# API Contracts

This directory contains the API contracts and specifications for the marketplace application.

## Files

- **openapi.yaml**: Complete OpenAPI 3.0 specification for all endpoints
- **product-api.ts**: TypeScript interfaces for product-related endpoints
- **auth-api.ts**: TypeScript interfaces for authentication endpoints
- **payment-api.ts**: TypeScript interfaces for payment and order endpoints
- **notification-api.ts**: TypeScript interfaces for notification endpoints

## API Endpoints

### Products
- `GET /api/v1/products` - List products with pagination and filters
- `POST /api/v1/products` - Create new product listing
- `GET /api/v1/products/{id}` - Get product details
- `PUT /api/v1/products/{id}` - Update product listing
- `DELETE /api/v1/products/{id}` - Delete product listing

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/profile` - Update user profile
- `PUT /api/v1/auth/password` - Change password

### Payments & Orders
- `POST /api/v1/payments/intent` - Create payment intent
- `POST /api/v1/payments/confirm` - Confirm payment
- `POST /api/v1/payments/cancel` - Cancel payment
- `GET /api/v1/payments/intent/{id}` - Get payment intent
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{id}` - Get order details
- `PUT /api/v1/orders/{id}/status` - Update order status
- `GET /api/v1/orders` - Get user orders
- `POST /api/v1/payments/refund` - Process refund

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `GET /api/v1/notifications/{id}` - Get notification details
- `PUT /api/v1/notifications/{id}/read` - Mark notification as read
- `PUT /api/v1/notifications/read-all` - Mark all notifications as read
- `DELETE /api/v1/notifications/{id}` - Delete notification
- `GET /api/v1/notifications/preferences` - Get notification preferences
- `PUT /api/v1/notifications/preferences` - Update notification preferences
- `GET /api/v1/notifications/unread-count` - Get unread count

### Upload
- `POST /api/v1/upload` - Upload product images

## Traceability

- **FR-001**: System MUST provide user authentication and registration with secure password handling
- **FR-002**: System MUST allow users to create, edit, and delete product listings with image uploads
- **FR-004**: System MUST integrate with Stripe for secure payment processing and transaction management
- **FR-005**: System MUST provide real-time notifications for purchase confirmations and listing updates
