// API Client Index
// Main export file for API client and services

export { ApiClient, apiClient } from './client';
export { AuthService, authService } from './services/auth';
export { ProductsService, productsService } from './services/products';
export { OrdersService, ordersService } from './services/orders';
export { PaymentsService, paymentsService } from './services/payments';
export { NotificationsService, notificationsService } from './services/notifications';

// Export types
export * from './types';

// Export error class
export { ApiError } from './types';
