// Order Types
// TypeScript type definitions for order-related data

// Order and OrderStatus are defined in database.ts
export type { Order, OrderStatus } from './database';
import type { OrderStatus } from './database';

export interface OrderCreateData {
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency?: string;
}

export interface OrderUpdateData {
  status?: OrderStatus;
  paymentIntentId?: string;
}

export interface OrderSearchParams {
  buyerId?: string;
  sellerId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  description: string;
}

export interface OrderSummary {
  id: string;
  product: {
    title: string;
    price: number;
    images: string[];
  };
  amount: number;
  status: OrderStatus;
  createdAt: string;
}