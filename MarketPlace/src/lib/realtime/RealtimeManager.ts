// Realtime Manager
// Manager for real-time updates and WebSocket connections

import { WebSocketClient, WebSocketConfig } from './WebSocketClient';
import { queryClient, queryKeys } from '../query/client';

export interface RealtimeConfig {
  websocket: WebSocketConfig;
  enableProductUpdates?: boolean;
  enableOrderUpdates?: boolean;
  enableNotificationUpdates?: boolean;
  enableUserUpdates?: boolean;
}

export class RealtimeManager {
  private wsClient: WebSocketClient;
  private config: RealtimeConfig;
  private isInitialized = false;

  constructor(config: RealtimeConfig) {
    this.config = config;
    this.wsClient = new WebSocketClient(config.websocket);
    this.setupMessageHandlers();
  }

  // Initialize real-time connections
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.wsClient.connect();
      this.isInitialized = true;
      console.log('Realtime manager initialized');
    } catch (error) {
      console.error('Failed to initialize realtime manager:', error);
      throw error;
    }
  }

  // Disconnect and cleanup
  disconnect(): void {
    this.wsClient.disconnect();
    this.isInitialized = false;
  }

  // Subscribe to product updates
  subscribeToProductUpdates(productId?: string): void {
    if (!this.config.enableProductUpdates) {
      return;
    }

    const messageType = productId ? `product_${productId}_updated` : 'product_updated';
    this.wsClient.subscribe(messageType, (data) => {
      this.handleProductUpdate(data, productId);
    });
  }

  // Subscribe to order updates
  subscribeToOrderUpdates(orderId?: string): void {
    if (!this.config.enableOrderUpdates) {
      return;
    }

    const messageType = orderId ? `order_${orderId}_updated` : 'order_updated';
    this.wsClient.subscribe(messageType, (data) => {
      this.handleOrderUpdate(data, orderId);
    });
  }

  // Subscribe to notification updates
  subscribeToNotificationUpdates(): void {
    if (!this.config.enableNotificationUpdates) {
      return;
    }

    this.wsClient.subscribe('notification_created', (data) => {
      this.handleNotificationCreated(data);
    });

    this.wsClient.subscribe('notification_updated', (data) => {
      this.handleNotificationUpdated(data);
    });
  }

  // Subscribe to user updates
  subscribeToUserUpdates(userId?: string): void {
    if (!this.config.enableUserUpdates) {
      return;
    }

    const messageType = userId ? `user_${userId}_updated` : 'user_updated';
    this.wsClient.subscribe(messageType, (data) => {
      this.handleUserUpdate(data, userId);
    });
  }

  // Unsubscribe from updates
  unsubscribe(type: string): void {
    this.wsClient.unsubscribe(type);
  }

  // Send real-time message
  sendMessage(type: string, data: any): void {
    this.wsClient.send({
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.wsClient.getConnectionStatus();
  }

  // Setup message handlers
  private setupMessageHandlers(): void {
    // Product update handler
    this.wsClient.subscribe('product_updated', (data) => {
      this.handleProductUpdate(data);
    });

    // Order update handler
    this.wsClient.subscribe('order_updated', (data) => {
      this.handleOrderUpdate(data);
    });

    // Notification handler
    this.wsClient.subscribe('notification_created', (data) => {
      this.handleNotificationCreated(data);
    });

    // User update handler
    this.wsClient.subscribe('user_updated', (data) => {
      this.handleUserUpdate(data);
    });
  }

  // Handle product updates
  private handleProductUpdate(data: any, productId?: string): void {
    console.log('Product update received:', data);

    // Invalidate product queries
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
    
    if (productId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
    }

    // Update specific product in cache if available
    if (data.product) {
      queryClient.setQueryData(queryKeys.products.detail(data.product.id), data.product);
    }

    // Trigger custom event for UI components
    window.dispatchEvent(new CustomEvent('productUpdated', { detail: data }));
  }

  // Handle order updates
  private handleOrderUpdate(data: any, orderId?: string): void {
    console.log('Order update received:', data);

    // Invalidate order queries
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.asBuyer() });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.asSeller() });
    
    if (orderId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
    }

    // Update specific order in cache if available
    if (data.order) {
      queryClient.setQueryData(queryKeys.orders.detail(data.order.id), data.order);
    }

    // Invalidate statistics
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.statistics });

    // Trigger custom event for UI components
    window.dispatchEvent(new CustomEvent('orderUpdated', { detail: data }));
  }

  // Handle notification creation
  private handleNotificationCreated(data: any): void {
    console.log('Notification created:', data);

    // Invalidate notification queries
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.recent() });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });

    // Add new notification to cache if available
    if (data.notification) {
      queryClient.setQueryData(queryKeys.notifications.detail(data.notification.id), data.notification);
    }

    // Trigger custom event for UI components
    window.dispatchEvent(new CustomEvent('notificationCreated', { detail: data }));
  }

  // Handle notification updates
  private handleNotificationUpdated(data: any): void {
    console.log('Notification updated:', data);

    // Invalidate notification queries
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.recent() });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });

    // Update specific notification in cache if available
    if (data.notification) {
      queryClient.setQueryData(queryKeys.notifications.detail(data.notification.id), data.notification);
    }

    // Trigger custom event for UI components
    window.dispatchEvent(new CustomEvent('notificationUpdated', { detail: data }));
  }

  // Handle user updates
  private handleUserUpdate(data: any, userId?: string): void {
    console.log('User update received:', data);

    // Invalidate user queries
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
    
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.userProfile(userId) });
    }

    // Update user data in cache if available
    if (data.user) {
      queryClient.setQueryData(queryKeys.auth.currentUser, data.user);
    }

    // Trigger custom event for UI components
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: data }));
  }
}

// Create default realtime manager instance
export const realtimeManager = new RealtimeManager({
  websocket: {
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001',
  },
  enableProductUpdates: true,
  enableOrderUpdates: true,
  enableNotificationUpdates: true,
  enableUserUpdates: true,
});
