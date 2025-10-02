// Orders API Service
// API service for order-related endpoints

import { apiClient } from '../client';
import {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  PaginationParams,
  PaginationResponse,
} from '../types';

export class OrdersService {
  // Get all orders for current user
  async getOrders(pagination?: PaginationParams): Promise<{
    orders: Order[];
    pagination: PaginationResponse;
  }> {
    const queryParams = new URLSearchParams();
    
    if (pagination?.page) {
      queryParams.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      queryParams.append('limit', pagination.limit.toString());
    }
    
    const endpoint = queryParams.toString() 
      ? `/orders?${queryParams.toString()}`
      : '/orders';
    
    const response = await apiClient.get<{
      orders: Order[];
      pagination: PaginationResponse;
    }>(endpoint);
    return response.data;
  }

  // Get order by ID
  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  }

  // Create new order
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', orderData);
    return response.data;
  }

  // Update order
  async updateOrder(id: string, orderData: UpdateOrderRequest): Promise<Order> {
    const response = await apiClient.put<Order>(`/orders/${id}`, orderData);
    return response.data;
  }

  // Cancel order
  async cancelOrder(id: string): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}/cancel`);
    return response.data;
  }

  // Get orders as buyer
  async getOrdersAsBuyer(pagination?: PaginationParams): Promise<{
    orders: Order[];
    pagination: PaginationResponse;
  }> {
    const queryParams = new URLSearchParams();
    
    if (pagination?.page) {
      queryParams.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      queryParams.append('limit', pagination.limit.toString());
    }
    
    const endpoint = queryParams.toString() 
      ? `/orders/buyer?${queryParams.toString()}`
      : '/orders/buyer';
    
    const response = await apiClient.get<{
      orders: Order[];
      pagination: PaginationResponse;
    }>(endpoint);
    return response.data;
  }

  // Get orders as seller
  async getOrdersAsSeller(pagination?: PaginationParams): Promise<{
    orders: Order[];
    pagination: PaginationResponse;
  }> {
    const queryParams = new URLSearchParams();
    
    if (pagination?.page) {
      queryParams.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      queryParams.append('limit', pagination.limit.toString());
    }
    
    const endpoint = queryParams.toString() 
      ? `/orders/seller?${queryParams.toString()}`
      : '/orders/seller';
    
    const response = await apiClient.get<{
      orders: Order[];
      pagination: PaginationResponse;
    }>(endpoint);
    return response.data;
  }

  // Get orders by status
  async getOrdersByStatus(status: string, pagination?: PaginationParams): Promise<{
    orders: Order[];
    pagination: PaginationResponse;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('status', status);
    
    if (pagination?.page) {
      queryParams.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      queryParams.append('limit', pagination.limit.toString());
    }
    
    const response = await apiClient.get<{
      orders: Order[];
      pagination: PaginationResponse;
    }>(`/orders/status?${queryParams.toString()}`);
    return response.data;
  }

  // Mark order as shipped
  async markOrderAsShipped(id: string, trackingNumber?: string): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}/ship`, {
      trackingNumber,
    });
    return response.data;
  }

  // Mark order as delivered
  async markOrderAsDelivered(id: string): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}/deliver`);
    return response.data;
  }

  // Get order statistics
  async getOrderStatistics(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const response = await apiClient.get<{
      totalOrders: number;
      pendingOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
    }>('/orders/statistics');
    return response.data;
  }

  // Get order analytics
  async getOrderAnalytics(timeRange?: {
    startDate: string;
    endDate: string;
  }): Promise<{
    ordersOverTime: Array<{ date: string; count: number; revenue: number }>;
    topProducts: Array<{ productId: string; productName: string; orderCount: number; revenue: number }>;
    orderStatusDistribution: Array<{ status: string; count: number; percentage: number }>;
  }> {
    const queryParams = new URLSearchParams();
    
    if (timeRange?.startDate) {
      queryParams.append('startDate', timeRange.startDate);
    }
    if (timeRange?.endDate) {
      queryParams.append('endDate', timeRange.endDate);
    }
    
    const endpoint = queryParams.toString() 
      ? `/orders/analytics?${queryParams.toString()}`
      : '/orders/analytics';
    
    const response = await apiClient.get<{
      ordersOverTime: Array<{ date: string; count: number; revenue: number }>;
      topProducts: Array<{ productId: string; productName: string; orderCount: number; revenue: number }>;
      orderStatusDistribution: Array<{ status: string; count: number; percentage: number }>;
    }>(endpoint);
    return response.data;
  }
}

// Create default instance
export const ordersService = new OrdersService();
