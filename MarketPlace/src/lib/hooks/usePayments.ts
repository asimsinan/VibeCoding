// Payments Hook
// React hook for payment data fetching and management

import { useState, useCallback } from 'react';
import { paymentsService } from '../api/services/payments';
import { PaymentIntent, CreatePaymentIntentRequest, ConfirmPaymentRequest } from '../api/types';

interface PaymentsState {
  isLoading: boolean;
  error: string | null;
}

interface PaymentsActions {
  createPaymentIntent: (paymentData: CreatePaymentIntentRequest) => Promise<PaymentIntent | null>;
  confirmPayment: (paymentData: ConfirmPaymentRequest) => Promise<{
    success: boolean;
    paymentIntent: PaymentIntent;
    order?: { id: string; status: string };
  } | null>;
  getPaymentIntent: (id: string) => Promise<PaymentIntent | null>;
  cancelPaymentIntent: (id: string) => Promise<PaymentIntent | null>;
  getPaymentMethods: () => Promise<Array<{
    id: string;
    type: 'card' | 'bank_account' | 'paypal';
    last4?: string;
    brand?: string;
    expMonth?: number;
    expYear?: number;
    isDefault: boolean;
  }> | null>;
  addPaymentMethod: (paymentMethodData: {
    type: 'card';
    card: { number: string; expMonth: number; expYear: number; cvc: string };
  }) => Promise<{
    id: string;
    type: 'card';
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
  } | null>;
  removePaymentMethod: (paymentMethodId: string) => Promise<void>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  processRefund: (paymentIntentId: string, amount?: number, reason?: string) => Promise<{
    id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
    reason?: string;
    createdAt: string;
  } | null>;
  clearError: () => void;
}

export function usePayments(): PaymentsState & PaymentsActions {
  const [state, setState] = useState<PaymentsState>({
    isLoading: false,
    error: null,
  });

  const createPaymentIntent = useCallback(async (paymentData: CreatePaymentIntentRequest): Promise<PaymentIntent | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const paymentIntent = await paymentsService.createPaymentIntent(paymentData);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return paymentIntent;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create payment intent',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const confirmPayment = useCallback(async (paymentData: ConfirmPaymentRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await paymentsService.confirmPayment(paymentData);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to confirm payment',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const getPaymentIntent = useCallback(async (id: string): Promise<PaymentIntent | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const paymentIntent = await paymentsService.getPaymentIntent(id);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return paymentIntent;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch payment intent',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const cancelPaymentIntent = useCallback(async (id: string): Promise<PaymentIntent | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const paymentIntent = await paymentsService.cancelPaymentIntent(id);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return paymentIntent;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to cancel payment intent',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const getPaymentMethods = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const paymentMethods = await paymentsService.getPaymentMethods();
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return paymentMethods;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch payment methods',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const addPaymentMethod = useCallback(async (paymentMethodData: {
    type: 'card';
    card: { number: string; expMonth: number; expYear: number; cvc: string };
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const paymentMethod = await paymentsService.addPaymentMethod(paymentMethodData);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return paymentMethod;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add payment method',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const removePaymentMethod = useCallback(async (paymentMethodId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await paymentsService.removePaymentMethod(paymentMethodId);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to remove payment method',
        isLoading: false,
      }));
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await paymentsService.setDefaultPaymentMethod(paymentMethodId);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to set default payment method',
        isLoading: false,
      }));
    }
  }, []);

  const processRefund = useCallback(async (paymentIntentId: string, amount?: number, reason?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const refund = await paymentsService.processRefund(paymentIntentId, amount, reason);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return refund;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process refund',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    createPaymentIntent,
    confirmPayment,
    getPaymentIntent,
    cancelPaymentIntent,
    getPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    processRefund,
    clearError,
  };
}
