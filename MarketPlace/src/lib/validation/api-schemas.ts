// API Validation Schemas
// Zod schemas for request/response validation

import { z } from 'zod';

// Common validation schemas
export const CuidSchema = z.string().regex(/^c[0-9a-z]{25}$/, 'Invalid CUID format');
export const EmailSchema = z.string().email('Invalid email format');
export const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const PriceSchema = z.number().positive('Price must be positive').multipleOf(0.01, 'Price must have at most 2 decimal places');
export const AmountSchema = z.number().int().min(0, 'Amount must be a non-negative integer');

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1, 'Page must be at least 1'),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1 && n <= 100, 'Limit must be between 1 and 100'),
});

export const SortSchema = z.object({
  sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Authentication schemas
export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
});

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const AuthResponseSchema = z.object({
  message: z.string(),
  user: z.object({
    id: CuidSchema,
    email: EmailSchema,
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().optional(),
    role: z.enum(['USER', 'ADMIN', 'SELLER']),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  sessionToken: z.string().optional(),
});

// Product schemas
export const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Product name too long'),
  description: z.string().min(1, 'Product description is required').max(1000, 'Product description too long'),
  price: PriceSchema,
  category: z.string().min(1, 'Category is required').max(50, 'Category name too long'),
  stock: AmountSchema,
  images: z.array(z.string().url('Invalid image URL')).max(10, 'Maximum 10 images allowed').optional(),
  tags: z.array(z.string().max(30, 'Tag too long')).max(20, 'Maximum 20 tags allowed').optional(),
  isActive: z.boolean().default(true),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const ProductQuerySchema = PaginationSchema.merge(SortSchema).extend({
  category: z.string().optional(),
  search: z.string().max(100, 'Search term too long').optional(),
  minPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
});

export const ProductResponseSchema = z.object({
  id: CuidSchema,
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
  stock: z.number(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean(),
  sellerId: CuidSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ProductsListResponseSchema = z.object({
  products: z.array(ProductResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Order schemas
export const OrderItemSchema = z.object({
  productId: CuidSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: PriceSchema,
});

export const ShippingAddressSchema = z.object({
  street: z.string().min(1, 'Street is required').max(100, 'Street too long'),
  city: z.string().min(1, 'City is required').max(50, 'City name too long'),
  state: z.string().min(1, 'State is required').max(50, 'State name too long'),
  zipCode: z.string().min(1, 'Zip code is required').max(20, 'Zip code too long'),
  country: z.string().min(1, 'Country is required').max(50, 'Country name too long'),
});

export const OrderCreateSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'At least one item is required').max(50, 'Maximum 50 items allowed'),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'stripe']),
});

export const OrderQuerySchema = PaginationSchema.merge(SortSchema).extend({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
});

export const OrderResponseSchema = z.object({
  id: CuidSchema,
  userId: CuidSchema,
  items: z.array(OrderItemSchema),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.string(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  totalAmount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const OrdersListResponseSchema = z.object({
  orders: z.array(OrderResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Payment schemas
export const PaymentIntentCreateSchema = z.object({
  orderId: CuidSchema,
  amount: PriceSchema,
  currency: z.string().length(3, 'Currency must be 3 characters').default('usd'),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'stripe']),
  metadata: z.record(z.string()).optional(),
});

export const PaymentConfirmSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
});

export const PaymentIntentResponseSchema = z.object({
  id: z.string(),
  orderId: CuidSchema,
  amount: z.number(),
  currency: z.string(),
  paymentMethod: z.string(),
  status: z.enum(['pending', 'processing', 'succeeded', 'failed', 'cancelled']),
  clientSecret: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: z.date(),
});

export const PaymentTransactionResponseSchema = z.object({
  id: z.string(),
  paymentIntentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'processing', 'succeeded', 'failed', 'cancelled']),
  transactionId: z.string().optional(),
  createdAt: z.date(),
});

// Health check schema
export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string(),
  version: z.string(),
  environment: z.string(),
  uptime: z.number(),
  memory: z.object({
    rss: z.number(),
    heapTotal: z.number(),
    heapUsed: z.number(),
    external: z.number(),
  }),
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
  timestamp: z.string(),
  version: z.string(),
});

// Success response schema
export const SuccessResponseSchema = z.object({
  data: z.any().optional(),
  message: z.string().optional(),
  timestamp: z.string(),
  version: z.string(),
});

// Validation helper functions
export function validateRequest<T>(data: unknown, schema: z.ZodSchema<T>): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

export function validateQueryParams<T>(searchParams: URLSearchParams, schema: z.ZodSchema<T>): { success: true; data: T } | { success: false; error: z.ZodError } {
  const params: Record<string, string> = {};
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  return validateRequest(params, schema);
}

// Type exports
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductsListResponse = z.infer<typeof ProductsListResponseSchema>;
export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type OrderQuery = z.infer<typeof OrderQuerySchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type OrdersListResponse = z.infer<typeof OrdersListResponseSchema>;
export type PaymentIntentCreate = z.infer<typeof PaymentIntentCreateSchema>;
export type PaymentConfirm = z.infer<typeof PaymentConfirmSchema>;
export type PaymentIntentResponse = z.infer<typeof PaymentIntentResponseSchema>;
export type PaymentTransactionResponse = z.infer<typeof PaymentTransactionResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
