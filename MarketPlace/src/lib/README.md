# Library Utilities

This directory contains shared utility functions, constants, and validators for the marketplace application.

## Files

- **utils.ts**: Utility functions for common operations
- **constants.ts**: Application constants and configuration
- **validators.ts**: Input validation schemas and functions

## Utility Functions

### ID Generation
- `generateId()`: Generate unique IDs with prefix
- `randomString()`: Generate random strings
- `randomEmail()`: Generate random email addresses
- `randomPrice()`: Generate random prices

### Formatting
- `formatCurrency()`: Format numbers as currency
- `formatDate()`: Format dates
- `formatDateTime()`: Format dates with time
- `truncateText()`: Truncate text to specified length
- `capitalizeFirst()`: Capitalize first letter
- `slugify()`: Convert string to URL slug

### Validation
- `isValidEmail()`: Validate email format
- `isValidPassword()`: Validate password strength
- `sanitizeString()`: Sanitize string input

### Data Manipulation
- `deepClone()`: Deep clone objects
- `isEmpty()`: Check if object is empty
- `sleep()`: Sleep function for delays
- `retry()`: Retry function with exponential backoff

## Constants

### Application Configuration
- `APP_CONFIG`: Basic app information
- `API_CONFIG`: API configuration
- `DATABASE_CONFIG`: Database configuration
- `AUTH_CONFIG`: Authentication configuration

### External Services
- `STRIPE_CONFIG`: Stripe payment configuration
- `AWS_CONFIG`: AWS S3 configuration
- `EMAIL_CONFIG`: Email service configuration
- `NOTIFICATION_CONFIG`: Notification configuration

### Security & Rate Limiting
- `RATE_LIMIT_CONFIG`: Rate limiting configuration
- `CORS_CONFIG`: CORS configuration
- `SECURITY_CONFIG`: Security settings

### Feature Configuration
- `PAGINATION_CONFIG`: Pagination settings
- `SEARCH_CONFIG`: Search functionality settings
- `FILE_UPLOAD_CONFIG`: File upload settings

### Messages
- `ERROR_MESSAGES`: Standard error messages
- `SUCCESS_MESSAGES`: Standard success messages

## Validators

### User Validation
- `userRegistrationSchema`: User registration validation
- `userLoginSchema`: User login validation
- `changePasswordSchema`: Password change validation
- `updateProfileSchema`: Profile update validation

### Product Validation
- `createProductSchema`: Product creation validation
- `updateProductSchema`: Product update validation
- `productSearchSchema`: Product search validation

### Order Validation
- `createOrderSchema`: Order creation validation
- `updateOrderStatusSchema`: Order status update validation

### Payment Validation
- `createPaymentIntentSchema`: Payment intent creation validation
- `confirmPaymentIntentSchema`: Payment confirmation validation
- `refundPaymentSchema`: Refund processing validation

### Notification Validation
- `createNotificationSchema`: Notification creation validation
- `updateNotificationPreferencesSchema`: Notification preferences validation

### File Upload Validation
- `fileUploadSchema`: File upload validation
- `paginationSchema`: Pagination validation

### Helper Functions
- `validateInput()`: Generic input validation
- `validateEmail()`: Email validation
- `validatePassword()`: Password validation
- `validatePrice()`: Price validation
- `validateImageUrl()`: Image URL validation
- `validatePagination()`: Pagination validation

## Usage Examples

### Utility Functions
```typescript
import { generateId, formatCurrency, isValidEmail } from '@/lib/utils';

const id = generateId('user');
const price = formatCurrency(29.99, 'USD');
const isValid = isValidEmail('user@example.com');
```

### Constants
```typescript
import { APP_CONFIG, ERROR_MESSAGES } from '@/lib/constants';

console.log(APP_CONFIG.name);
throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
```

### Validators
```typescript
import { validateInput, userRegistrationSchema } from '@/lib/validators';

try {
  const userData = validateInput(userRegistrationSchema, input);
  // Process validated user data
} catch (error) {
  // Handle validation errors
}
```

## Traceability

- **FR-001**: System MUST provide user authentication and registration with secure password handling
- **FR-002**: System MUST allow users to create, edit, and delete product listings with image uploads
- **FR-004**: System MUST integrate with Stripe for secure payment processing and transaction management
- **FR-005**: System MUST provide real-time notifications for purchase confirmations and listing updates
