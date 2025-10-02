// WebSocket Client
// Real-time communication client for live updates

import { queryClient, queryKeys } from '../query/client';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  // Connect to WebSocket server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          
          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
  }

  // Send message to server
  send(message: WebSocketMessage): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  // Subscribe to specific message types
  subscribe(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  // Unsubscribe from message type
  unsubscribe(type: string): void {
    this.messageHandlers.delete(type);
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }

    // Handle specific message types
    switch (message.type) {
      case 'product_updated':
        this.handleProductUpdate(message.data);
        break;
      case 'order_updated':
        this.handleOrderUpdate(message.data);
        break;
      case 'notification_created':
        this.handleNotificationCreated(message.data);
        break;
      case 'user_status_changed':
        this.handleUserStatusChange(message.data);
        break;
      case 'heartbeat':
        // Respond to heartbeat
        this.send({ type: 'heartbeat_response', data: {}, timestamp: new Date().toISOString() });
        break;
    }
  }

  // Handle product updates
  private handleProductUpdate(data: any): void {
    // Invalidate product queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(data.id) });
    
    // Update specific product in cache if available
    if (data.product) {
      queryClient.setQueryData(queryKeys.products.detail(data.id), data.product);
    }
  }

  // Handle order updates
  private handleOrderUpdate(data: any): void {
    // Invalidate order queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(data.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.asBuyer() });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.asSeller() });
    
    // Update specific order in cache if available
    if (data.order) {
      queryClient.setQueryData(queryKeys.orders.detail(data.id), data.order);
    }
    
    // Invalidate statistics
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.statistics });
  }

  // Handle notification creation
  private handleNotificationCreated(data: any): void {
    // Invalidate notification queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.recent() });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    
    // Add new notification to cache if available
    if (data.notification) {
      queryClient.setQueryData(queryKeys.notifications.detail(data.notification.id), data.notification);
    }
  }

  // Handle user status changes
  private handleUserStatusChange(_data: any): void {
    // Invalidate user-related queries
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'heartbeat', data: {}, timestamp: new Date().toISOString() });
      }
    }, this.config.heartbeatInterval);
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Schedule reconnection
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
      
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval);
  }

  // Clear reconnect timer
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get reconnect attempts count
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}
