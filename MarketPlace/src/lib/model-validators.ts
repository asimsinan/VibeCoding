// Model Validation Functions
// Business logic validation functions for data models

import { z } from 'zod';
import {
  createUserInputSchema,
  createProductInputSchema,
  createOrderInputSchema,
  createNotificationInputSchema,
  updateUserInputSchema,
  updateProductInputSchema,
  updateOrderInputSchema,
  updateNotificationInputSchema,
  UserInput,
  ProductInput,
  OrderInput,
  NotificationInput,
  UpdateUserInput,
  UpdateProductInput,
  UpdateOrderInput,
  UpdateNotificationInput,
} from './validators';

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// User model validation functions
export class UserModelValidator {
  static validateCreateUser(input: unknown): ValidationResult<UserInput> {
    try {
      const data = createUserInputSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Invalid input format'] };
    }
  }

  static validateUpdateUser(input: unknown): ValidationResult<UpdateUserInput> {
    try {
      const data = updateUserInputSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Invalid input format'] };
    }
  }

  static validateUsername(username: string): ValidationResult<string> {
    if (!username || typeof username !== 'string') {
      return { success: false, errors: ['Username is required'] };
    }

    if (username.length < 3 || username.length > 50) {
      return { success: false, errors: ['Username must be between 3 and 50 characters'] };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { success: false, errors: ['Username can only contain letters, numbers, and underscores'] };
    }

    return { success: true, data: username };
  }

  static validateEmail(email: string): ValidationResult<string> {
    if (!email || typeof email !== 'string') {
      return { success: false, errors: ['Email is required'] };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, errors: ['Invalid email format'] };
    }

    return { success: true, data: email };
  }

  static validatePassword(password: string): ValidationResult<string> {
    if (!password || typeof password !== 'string') {
      return { success: false, errors: ['Password is required'] };
    }

    if (password.length < 8) {
      return { success: false, errors: ['Password must be at least 8 characters long'] };
    }

    if (password.length > 100) {
      return { success: false, errors: ['Password must be less than 100 characters'] };
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return {
        success: false,
        errors: ['Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character']
      };
    }

    return { success: true, data: password };
  }

  static validatePhone(phone: string): ValidationResult<string> {
    if (!phone) {
      return { success: true, data: phone }; // Phone is optional
    }

    if (typeof phone !== 'string') {
      return { success: false, errors: ['Phone must be a string'] };
    }

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone)) {
      return { success: false, errors: ['Invalid phone number format'] };
    }

    return { success: true, data: phone };
  }
}

// Product model validation functions
export class ProductModelValidator {
  static validateCreateProduct(input: unknown): ValidationResult<ProductInput> {
    try {
      const data = createProductInputSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Invalid input format'] };
    }
  }

  static validateUpdateProduct(input: unknown): ValidationResult<UpdateProductInput> {
    try {
      const data = updateProductInputSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Invalid input format'] };
    }
  }

  static validateTitle(title: string): ValidationResult<string> {
    if (!title || typeof title !== 'string') {
      return { success: false, errors: ['Title is required'] };
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1) {
      return { success: false, errors: ['Title cannot be empty'] };
    }

    if (trimmedTitle.length > 200) {
      return { success: false, errors: ['Title must be less than 200 characters'] };
    }

    return { success: true, data: trimmedTitle };
  }

  static validateDescription(description: string): ValidationResult<string> {
    if (!description || typeof description !== 'string') {
      return { success: false, errors: ['Description is required'] };
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 1) {
      return { success: false, errors: ['Description cannot be empty'] };
    }

    if (trimmedDescription.length > 2000) {
      return { success: false, errors: ['Description must be less than 2000 characters'] };
    }

    return { success: true, data: trimmedDescription };
  }

  static validatePrice(price: number): ValidationResult<number> {
    if (typeof price !== 'number') {
      return { success: false, errors: ['Price must be a number'] };
    }

    if (price <= 0) {
      return { success: false, errors: ['Price must be greater than 0'] };
    }

    if (price > 999999.99) {
      return { success: false, errors: ['Price must be less than $999,999.99'] };
    }

    if (Math.round(price * 100) / 100 !== price) {
      return { success: false, errors: ['Price must be rounded to the nearest cent'] };
    }

    return { success: true, data: price };
  }

  static validateImages(images: string[]): ValidationResult<string[]> {
    if (!Array.isArray(images)) {
      return { success: false, errors: ['Images must be an array'] };
    }

    if (images.length < 1) {
      return { success: false, errors: ['At least one image is required'] };
    }

    if (images.length > 10) {
      return { success: false, errors: ['Maximum 10 images allowed'] };
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (typeof image !== 'string') {
        return { success: false, errors: [`Image ${i + 1} must be a string`] };
      }

      try {
        new URL(image);
      } catch {
        return { success: false, errors: [`Image ${i + 1} must be a valid URL`] };
      }
    }

    return { success: true, data: images };
  }

  static validateCategory(category: string): ValidationResult<string> {
    if (!category || typeof category !== 'string') {
      return { success: false, errors: ['Category is required'] };
    }

    const trimmedCategory = category.trim();
    if (trimmedCategory.length < 1) {
      return { success: false, errors: ['Category cannot be empty'] };
    }

    if (trimmedCategory.length > 100) {
      return { success: false, errors: ['Category must be less than 100 characters'] };
    }

    return { success: true, data: trimmedCategory };
  }
}

// Order model validation functions
export class OrderModelValidator {
  static validateCreateOrder(input: unknown): ValidationResult<OrderInput> {
    try {
      const data = createOrderInputSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Invalid input format'] };
    }
  }

  static validateUpdateOrder(input: unknown): ValidationResult<UpdateOrderInput> {
    try {
      const data = updateOrderInputSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Invalid input format'] };
    }
  }

  static validateAmount(amount: number): ValidationResult<number> {
    if (typeof amount !== 'number') {
      return { success: false, errors: ['Amount must be a number'] };
    }

    if (amount <= 0) {
      return { success: false, errors: ['Amount must be greater than 0'] };
    }

    if (amount > 999999.99) {
      return { success: false, errors: ['Amount must be less than $999,999.99'] };
    }

    if (Math.round(amount * 100) / 100 !== amount) {
      return { success: false, errors: ['Amount must be rounded to the nearest cent'] };
    }

    return { success: true, data: amount };
  }

  static validateCurrency(currency: string): ValidationResult<string> {
    if (!currency || typeof currency !== 'string') {
      return { success: false, errors: ['Currency is required'] };
    }

    if (currency.length !== 3) {
      return { success: false, errors: ['Currency must be a 3-letter code'] };
    }

    const validCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud', 'jpy'];
    if (!validCurrencies.includes(currency.toLowerCase())) {
      return { success: false, errors: ['Unsupported currency'] };
    }

    return { success: true, data: currency.toLowerCase() };
  }

  static validateStatus(status: string): ValidationResult<string> {
    const validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    
    if (!status || typeof status !== 'string') {
      return { success: false, errors: ['Status is required'] };
    }

    if (!validStatuses.includes(status.toUpperCase())) {
      return { success: false, errors: ['Invalid order status'] };
    }

    return { success: true, data: status.toUpperCase() };
  }
}

// Notification model validation functions
export class NotificationModelValidator {
  static validateCreateNotification(input: unknown): ValidationResult<NotificationInput> {
    try {
      const data = createNotificationInputSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Invalid input format'] };
    }
  }

  static validateUpdateNotification(input: unknown): ValidationResult<UpdateNotificationInput> {
    try {
      const data = updateNotificationInputSchema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Invalid input format'] };
    }
  }

  static validateType(type: string): ValidationResult<string> {
    const validTypes = [
      'PURCHASE_CONFIRMATION',
      'SALE_CONFIRMATION',
      'PRODUCT_SOLD',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED',
      'PAYMENT_RECEIVED',
      'LISTING_UPDATED',
      'SYSTEM_ALERT'
    ];

    if (!type || typeof type !== 'string') {
      return { success: false, errors: ['Notification type is required'] };
    }

    if (!validTypes.includes(type.toUpperCase())) {
      return { success: false, errors: ['Invalid notification type'] };
    }

    return { success: true, data: type.toUpperCase() };
  }

  static validateTitle(title: string): ValidationResult<string> {
    if (!title || typeof title !== 'string') {
      return { success: false, errors: ['Title is required'] };
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1) {
      return { success: false, errors: ['Title cannot be empty'] };
    }

    if (trimmedTitle.length > 200) {
      return { success: false, errors: ['Title must be less than 200 characters'] };
    }

    return { success: true, data: trimmedTitle };
  }

  static validateMessage(message: string): ValidationResult<string> {
    if (!message || typeof message !== 'string') {
      return { success: false, errors: ['Message is required'] };
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 1) {
      return { success: false, errors: ['Message cannot be empty'] };
    }

    if (trimmedMessage.length > 1000) {
      return { success: false, errors: ['Message must be less than 1000 characters'] };
    }

    return { success: true, data: trimmedMessage };
  }
}

// Generic validation utilities
export class ValidationUtils {
  static validateCuid(id: string): ValidationResult<string> {
    if (!id || typeof id !== 'string') {
      return { success: false, errors: ['ID is required'] };
    }

    const cuidRegex = /^c[0-9a-z]{25}$/;
    if (!cuidRegex.test(id)) {
      return { success: false, errors: ['Invalid ID format'] };
    }

    return { success: true, data: id };
  }

  static validateUrl(url: string): ValidationResult<string> {
    if (!url || typeof url !== 'string') {
      return { success: false, errors: ['URL is required'] };
    }

    try {
      new URL(url);
      return { success: true, data: url };
    } catch {
      return { success: false, errors: ['Invalid URL format'] };
    }
  }

  static validatePagination(page: number, limit: number): ValidationResult<{ page: number; limit: number }> {
    if (typeof page !== 'number' || page < 1) {
      return { success: false, errors: ['Page must be a positive number'] };
    }

    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      return { success: false, errors: ['Limit must be between 1 and 100'] };
    }

    return { success: true, data: { page, limit } };
  }

  static validateSort(field: string, direction: string): ValidationResult<{ field: string; direction: 'asc' | 'desc' }> {
    if (!field || typeof field !== 'string') {
      return { success: false, errors: ['Sort field is required'] };
    }

    if (!direction || typeof direction !== 'string') {
      return { success: false, errors: ['Sort direction is required'] };
    }

    const validDirections = ['asc', 'desc'];
    if (!validDirections.includes(direction.toLowerCase())) {
      return { success: false, errors: ['Sort direction must be "asc" or "desc"'] };
    }

    return { success: true, data: { field, direction: direction.toLowerCase() as 'asc' | 'desc' } };
  }
}

// Export all validators
export const ModelValidators = {
  User: UserModelValidator,
  Product: ProductModelValidator,
  Order: OrderModelValidator,
  Notification: NotificationModelValidator,
  Utils: ValidationUtils,
};
