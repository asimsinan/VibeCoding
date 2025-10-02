// Payments API Service
// API service for payment-related endpoints

import { apiClient } from '../client';
import {
  PaymentIntent,
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
} from '../types';

export class PaymentsService {
  // Create payment intent
  async createPaymentIntent(paymentData: CreatePaymentIntentRequest): Promise<PaymentIntent> {
    const response = await apiClient.post<PaymentIntent>('/payments/create-intent', paymentData);
    return response.data;
  }

  // Confirm payment
  async confirmPayment(paymentData: ConfirmPaymentRequest): Promise<{
    success: boolean;
    paymentIntent: PaymentIntent;
    order?: {
      id: string;
      status: string;
    };
  }> {
    const response = await apiClient.post<{
      success: boolean;
      paymentIntent: PaymentIntent;
      order?: {
        id: string;
        status: string;
      };
    }>('/payments/confirm', paymentData);
    return response.data;
  }

  // Get payment intent by ID
  async getPaymentIntent(_id: string): Promise<PaymentIntent> {
    const response = await apiClient.get<PaymentIntent>(`/payments/intent/${id}`);
    return response.data;
  }

  // Cancel payment intent
  async cancelPaymentIntent(id: string): Promise<PaymentIntent> {
    const response = await apiClient.patch<PaymentIntent>(`/payments/intent/${id}/cancel`);
    return response.data;
  }

  // Get payment methods
  async getPaymentMethods(): Promise<Array<{
    id: string;
    type: 'card' | 'bank_account' | 'paypal';
    last4?: string;
    brand?: string;
    expMonth?: number;
    expYear?: number;
    isDefault: boolean;
  }>> {
    const response = await apiClient.get<Array<{
      id: string;
      type: 'card' | 'bank_account' | 'paypal';
      last4?: string;
      brand?: string;
      expMonth?: number;
      expYear?: number;
      isDefault: boolean;
    }>>('/payments/methods');
    return response.data;
  }

  // Add payment method
  async addPaymentMethod(paymentMethodData: {
    type: 'card';
    card: {
      number: string;
      expMonth: number;
      expYear: number;
      cvc: string;
    };
  }): Promise<{
    id: string;
    type: 'card';
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
  }> {
    const response = await apiClient.post<{
      id: string;
      type: 'card';
      last4: string;
      brand: string;
      expMonth: number;
      expYear: number;
      isDefault: boolean;
    }>('/payments/methods', paymentMethodData);
    return response.data;
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    await apiClient.delete(`/payments/methods/${paymentMethodId}`);
  }

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    await apiClient.patch(`/payments/methods/${paymentMethodId}/default`);
  }

  // Get payment history
  async getPaymentHistory(pagination?: {
    page?: number;
    limit?: number;
  }): Promise<{
    payments: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      description: string;
      createdAt: string;
      orderId?: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (pagination?.page) {
      queryParams.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      queryParams.append('limit', pagination.limit.toString());
    }
    
    const endpoint = queryParams.toString() 
      ? `/payments/history?${queryParams.toString()}`
      : '/payments/history';
    
    const response = await apiClient.get<{
      payments: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        description: string;
        createdAt: string;
        orderId?: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(endpoint);
    return response.data;
  }

  // Process refund
  async processRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
    reason?: string;
    createdAt: string;
  }> {
    const response = await apiClient.post<{
      id: string;
      amount: number;
      currency: string;
      status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
      reason?: string;
      createdAt: string;
    }>('/payments/refund', {
      paymentIntentId,
      amount,
      reason,
    });
    return response.data;
  }

  // Get refund status
  async getRefundStatus(refundId: string): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
    reason?: string;
    createdAt: string;
    processedAt?: string;
  }> {
    const response = await apiClient.get<{
      id: string;
      amount: number;
      currency: string;
      status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
      reason?: string;
      createdAt: string;
      processedAt?: string;
    }>(`/payments/refund/${refundId}`);
    return response.data;
  }

  // Get payment analytics
  async getPaymentAnalytics(timeRange?: {
    startDate: string;
    endDate: string;
  }): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    successRate: number;
    refundRate: number;
    revenueOverTime: Array<{ date: string; revenue: number; transactions: number }>;
    paymentMethodDistribution: Array<{ method: string; count: number; percentage: number }>;
  }> {
    const queryParams = new URLSearchParams();
    
    if (timeRange?.startDate) {
      queryParams.append('startDate', timeRange.startDate);
    }
    if (timeRange?.endDate) {
      queryParams.append('endDate', timeRange.endDate);
    }
    
    const endpoint = queryParams.toString() 
      ? `/payments/analytics?${queryParams.toString()}`
      : '/payments/analytics';
    
    const response = await apiClient.get<{
      totalRevenue: number;
      totalTransactions: number;
      averageTransactionValue: number;
      successRate: number;
      refundRate: number;
      revenueOverTime: Array<{ date: string; revenue: number; transactions: number }>;
      paymentMethodDistribution: Array<{ method: string; count: number; percentage: number }>;
    }>(endpoint);
    return response.data;
  }
}

// Create default instance
export const paymentsService = new PaymentsService();
