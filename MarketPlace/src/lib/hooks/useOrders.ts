// Orders Hook
// React hook for order data fetching and management

import { useState, useEffect, useCallback } from 'react';
import { ordersService } from '../api/services/orders';
import { Order, CreateOrderRequest, UpdateOrderRequest } from '../api/types';

interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

interface OrdersActions {
  fetchOrders: (pagination?: { page?: number; limit?: number }) => Promise<void>;
  fetchOrdersAsBuyer: (pagination?: { page?: number; limit?: number }) => Promise<void>;
  fetchOrdersAsSeller: (pagination?: { page?: number; limit?: number }) => Promise<void>;
  fetchOrder: (id: string) => Promise<Order | null>;
  createOrder: (orderData: CreateOrderRequest) => Promise<Order | null>;
  updateOrder: (id: string, orderData: UpdateOrderRequest) => Promise<Order | null>;
  cancelOrder: (id: string) => Promise<Order | null>;
  markAsShipped: (id: string, trackingNumber?: string) => Promise<Order | null>;
  markAsDelivered: (id: string) => Promise<Order | null>;
  clearError: () => void;
  clearOrders: () => void;
}

export function useOrders(): OrdersState & OrdersActions {
  const [state, setState] = useState<OrdersState>({
    orders: [],
    isLoading: false,
    error: null,
    pagination: null,
  });

  const fetchOrders = useCallback(async (pagination?: { page?: number; limit?: number }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await ordersService.getOrders(pagination);
      setState(prev => ({
        ...prev,
        orders: response.orders,
        pagination: response.pagination,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        isLoading: false,
      }));
    }
  }, []);

  const fetchOrdersAsBuyer = useCallback(async (pagination?: { page?: number; limit?: number }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await ordersService.getOrdersAsBuyer(pagination);
      setState(prev => ({
        ...prev,
        orders: response.orders,
        pagination: response.pagination,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch buyer orders',
        isLoading: false,
      }));
    }
  }, []);

  const fetchOrdersAsSeller = useCallback(async (pagination?: { page?: number; limit?: number }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await ordersService.getOrdersAsSeller(pagination);
      setState(prev => ({
        ...prev,
        orders: response.orders,
        pagination: response.pagination,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch seller orders',
        isLoading: false,
      }));
    }
  }, []);

  const fetchOrder = useCallback(async (id: string): Promise<Order | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const order = await ordersService.getOrderById(id);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch order',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const createOrder = useCallback(async (orderData: CreateOrderRequest): Promise<Order | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const order = await ordersService.createOrder(orderData);
      setState(prev => ({
        ...prev,
        orders: [order, ...prev.orders],
        isLoading: false,
      }));
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create order',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const updateOrder = useCallback(async (id: string, orderData: UpdateOrderRequest): Promise<Order | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const order = await ordersService.updateOrder(id, orderData);
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === id ? order : o),
        isLoading: false,
      }));
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update order',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const cancelOrder = useCallback(async (id: string): Promise<Order | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const order = await ordersService.cancelOrder(id);
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === id ? order : o),
        isLoading: false,
      }));
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to cancel order',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const markAsShipped = useCallback(async (id: string, trackingNumber?: string): Promise<Order | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const order = await ordersService.markOrderAsShipped(id, trackingNumber);
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === id ? order : o),
        isLoading: false,
      }));
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to mark order as shipped',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const markAsDelivered = useCallback(async (id: string): Promise<Order | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const order = await ordersService.markOrderAsDelivered(id);
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === id ? order : o),
        isLoading: false,
      }));
      return order;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to mark order as delivered',
        isLoading: false,
      }));
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearOrders = useCallback(() => {
    setState(prev => ({
      ...prev,
      orders: [],
      pagination: null,
    }));
  }, []);

  return {
    ...state,
    fetchOrders,
    fetchOrdersAsBuyer,
    fetchOrdersAsSeller,
    fetchOrder,
    createOrder,
    updateOrder,
    cancelOrder,
    markAsShipped,
    markAsDelivered,
    clearError,
    clearOrders,
  };
}

// Hook for single order
export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) {return;}
    
    setIsLoading(true);
    setError(null);
    
    try {
      const orderData = await ordersService.getOrderById(id);
      setOrder(orderData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch order');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
  };
}
