// Validation Schemas
// Comprehensive Zod validation schemas for data validation

import { z } from 'zod';

// Base validation schemas
export const cuidSchema = z.string().cuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const positiveNumberSchema = z.number().positive();
export const currencySchema = z.string().length(3).default('usd');

// User validation schemas
export const userSchema = z.object({
  id: cuidSchema,
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: emailSchema,
  passwordHash: z.string().min(8),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userProfileSchema = z.object({
  id: cuidSchema,
  userId: cuidSchema,
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  bio: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  phone: z.string().max(20).regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  avatar: urlSchema.optional(),
});

export const userPreferencesSchema = z.object({
  id: cuidSchema,
  userId: cuidSchema,
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  sms: z.boolean().default(false),
  transactionNotifications: z.boolean().default(true),
  productNotifications: z.boolean().default(true),
  orderNotifications: z.boolean().default(true),
  systemNotifications: z.boolean().default(true),
});

// Product validation schemas
export const productSchema = z.object({
  id: cuidSchema,
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(2000).trim(),
  price: z.number().positive().max(999999.99).multipleOf(0.01),
  images: z.array(urlSchema).min(1).max(10),
  category: z.string().min(1).max(100).trim(),
  sellerId: cuidSchema,
  isAvailable: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Order validation schemas
export const orderStatusEnum = z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']);

export const orderSchema = z.object({
  id: cuidSchema,
  buyerId: cuidSchema,
  sellerId: cuidSchema,
  productId: cuidSchema,
  amount: z.number().positive().max(999999.99).multipleOf(0.01),
  currency: currencySchema,
  status: orderStatusEnum.default('PENDING'),
  paymentIntentId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const orderStatusSchema = z.object({
  id: cuidSchema,
  orderId: cuidSchema,
  status: z.string().min(1).max(50),
  lastUpdated: z.date(),
});

// Notification validation schemas
export const notificationTypeEnum = z.enum([
  'PURCHASE_CONFIRMATION',
  'SALE_CONFIRMATION',
  'PRODUCT_SOLD',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'PAYMENT_RECEIVED',
  'LISTING_UPDATED',
  'SYSTEM_ALERT'
]);

export const notificationCategoryEnum = z.enum(['TRANSACTION', 'PRODUCT', 'ORDER', 'SYSTEM']);

export const notificationSchema = z.object({
  id: cuidSchema,
  userId: cuidSchema,
  type: notificationTypeEnum,
  title: z.string().min(1).max(200).trim(),
  message: z.string().min(1).max(1000).trim(),
  data: z.any().optional(),
  isRead: z.boolean().default(false),
  readAt: z.date().optional(),
  createdAt: z.date(),
});

export const notificationTypeSchema = z.object({
  id: cuidSchema,
  type: notificationTypeEnum,
  category: notificationCategoryEnum,
});

// Category validation schemas
export const categorySchema = z.object({
  id: cuidSchema,
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  parentId: cuidSchema.optional(),
  createdAt: z.date(),
});

// Image upload validation schemas
export const imageUploadSchema = z.object({
  id: cuidSchema,
  filename: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().regex(/^image\//),
  size: z.number().positive().max(10 * 1024 * 1024), // 10MB max
  url: urlSchema,
  thumbnailUrl: urlSchema.optional(),
  uploadedBy: cuidSchema,
  createdAt: z.date(),
});

// Payment validation schemas
export const paymentStatusEnum = z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED']);

export const paymentIntentSchema = z.object({
  id: cuidSchema,
  stripeId: z.string().min(1).max(255),
  amount: z.number().positive().max(999999.99).multipleOf(0.01),
  currency: currencySchema,
  status: paymentStatusEnum.default('PENDING'),
  clientSecret: z.string().min(1).max(255),
  orderId: cuidSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const refundStatusEnum = z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED']);

export const refundSchema = z.object({
  id: cuidSchema,
  stripeId: z.string().min(1).max(255),
  paymentIntentId: cuidSchema,
  amount: z.number().positive().max(999999.99).multipleOf(0.01),
  currency: currencySchema,
  status: refundStatusEnum.default('PENDING'),
  reason: z.string().max(500).optional(),
  createdAt: z.date(),
});

// Input validation schemas for creating entities
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: emailSchema,
  password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  bio: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  phone: z.string().max(20).regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  avatar: urlSchema.optional(),
});

export const createUserProfileInputSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  bio: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  phone: z.string().max(20).regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  avatar: urlSchema.optional(),
});

export const createUserPreferencesInputSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  sms: z.boolean().default(false),
  transactionNotifications: z.boolean().default(true),
  productNotifications: z.boolean().default(true),
  orderNotifications: z.boolean().default(true),
  systemNotifications: z.boolean().default(true),
});

export const createProductInputSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(2000).trim(),
  price: z.number().positive().max(999999.99).multipleOf(0.01),
  images: z.array(urlSchema).min(1).max(10),
  category: z.string().min(1).max(100).trim(),
});

export const createOrderInputSchema = z.object({
  productId: cuidSchema,
  amount: z.number().positive().max(999999.99).multipleOf(0.01),
  currency: currencySchema.default('usd'),
});

export const createNotificationInputSchema = z.object({
  userId: cuidSchema,
  type: notificationTypeEnum,
  title: z.string().min(1).max(200).trim(),
  message: z.string().min(1).max(1000).trim(),
  data: z.any().optional(),
});

export const createCategoryInputSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  parentId: cuidSchema.optional(),
});

export const createImageUploadInputSchema = z.object({
  filename: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().regex(/^image\//),
  size: z.number().positive().max(10 * 1024 * 1024),
  url: urlSchema,
  thumbnailUrl: urlSchema.optional(),
});

export const createPaymentIntentInputSchema = z.object({
  stripeId: z.string().min(1).max(255),
  amount: z.number().positive().max(999999.99).multipleOf(0.01),
  currency: currencySchema,
  status: paymentStatusEnum.default('PENDING'),
  clientSecret: z.string().min(1).max(255),
  orderId: cuidSchema.optional(),
});

export const createRefundInputSchema = z.object({
  stripeId: z.string().min(1).max(255),
  paymentIntentId: cuidSchema,
  amount: z.number().positive().max(999999.99).multipleOf(0.01),
  currency: currencySchema,
  status: refundStatusEnum.default('PENDING'),
  reason: z.string().max(500).optional(),
});

// Update input validation schemas
export const updateUserInputSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
  email: emailSchema.optional(),
  password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).optional(),
  isActive: z.boolean().optional(),
});

export const updateUserProfileInputSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  phone: z.string().max(20).regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  avatar: urlSchema.optional(),
});

export const updateUserPreferencesInputSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
  transactionNotifications: z.boolean().optional(),
  productNotifications: z.boolean().optional(),
  orderNotifications: z.boolean().optional(),
  systemNotifications: z.boolean().optional(),
});

export const updateProductInputSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().min(1).max(2000).trim().optional(),
  price: z.number().positive().max(999999.99).multipleOf(0.01).optional(),
  images: z.array(urlSchema).min(1).max(10).optional(),
  category: z.string().min(1).max(100).trim().optional(),
  isAvailable: z.boolean().optional(),
});

export const updateOrderInputSchema = z.object({
  status: orderStatusEnum.optional(),
  paymentIntentId: z.string().optional(),
});

export const updateNotificationInputSchema = z.object({
  isRead: z.boolean().optional(),
  readAt: z.date().optional(),
});

export const updateCategoryInputSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).optional(),
  parentId: cuidSchema.optional(),
});

export const updatePaymentIntentInputSchema = z.object({
  status: paymentStatusEnum.optional(),
  clientSecret: z.string().min(1).max(255).optional(),
});

export const updateRefundInputSchema = z.object({
  status: refundStatusEnum.optional(),
  reason: z.string().max(500).optional(),
});

// Query validation schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const sortSchema = z.object({
  field: z.string().min(1),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  isAvailable: z.boolean().optional(),
  sellerId: cuidSchema.optional(),
  search: z.string().optional(),
});

export const orderFilterSchema = z.object({
  buyerId: cuidSchema.optional(),
  sellerId: cuidSchema.optional(),
  status: orderStatusEnum.optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
});

export const notificationFilterSchema = z.object({
  userId: cuidSchema.optional(),
  type: notificationTypeEnum.optional(),
  isRead: z.boolean().optional(),
});

export const userFilterSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().min(1).max(100).trim(),
  filters: z.object({
    category: z.string().optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    isAvailable: z.boolean().optional(),
  }).optional(),
  pagination: paginationSchema.optional(),
  sort: sortSchema.optional(),
});

// Authentication validation schemas
export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const registerInputSchema = createUserInputSchema;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
});

export const resetPasswordInputSchema = z.object({
  email: emailSchema,
});

export const resetPasswordConfirmInputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
});

// Contact form validation schema
export const contactSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: emailSchema,
  subject: z.string().min(1).max(200).trim(),
  message: z.string().min(10).max(2000).trim(),
});

// Utility validation functions
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).safeParse(password).success;
};

export const validatePrice = (price: number): boolean => {
  return z.number().positive().max(999999.99).multipleOf(0.01).safeParse(price).success;
};

export const validateUrl = (url: string): boolean => {
  return urlSchema.safeParse(url).success;
};

export const validateCuid = (id: string): boolean => {
  return cuidSchema.safeParse(id).success;
};

export const validatePhone = (phone: string): boolean => {
  return z.string().max(20).regex(/^[\+]?[1-9][\d]{0,15}$/).safeParse(phone).success;
};

// Export types
export type UserInput = z.infer<typeof createUserInputSchema>;
export type UserProfileInput = z.infer<typeof createUserProfileInputSchema>;
export type UserPreferencesInput = z.infer<typeof createUserPreferencesInputSchema>;
export type ProductInput = z.infer<typeof createProductInputSchema>;
export type OrderInput = z.infer<typeof createOrderInputSchema>;
export type NotificationInput = z.infer<typeof createNotificationInputSchema>;
export type CategoryInput = z.infer<typeof createCategoryInputSchema>;
export type ImageUploadInput = z.infer<typeof createImageUploadInputSchema>;
export type PaymentIntentInput = z.infer<typeof createPaymentIntentInputSchema>;
export type RefundInput = z.infer<typeof createRefundInputSchema>;

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;
export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderInputSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationInputSchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;
export type UpdatePaymentIntentInput = z.infer<typeof updatePaymentIntentInputSchema>;
export type UpdateRefundInput = z.infer<typeof updateRefundInputSchema>;

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortInput = z.infer<typeof sortSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
export type SearchInput = z.infer<typeof searchSchema>;

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmInputSchema>;
export type ContactInput = z.infer<typeof contactSchema>;