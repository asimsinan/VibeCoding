/**
 * Real-time Update Service
 * 
 * Handles real-time updates for mood data using WebSocket or Server-Sent Events.
 * 
 * @fileoverview Real-time update service
 * @author Mental Health Journal App
 * @version 1.0.0
 */

import { MoodEntry, User } from '../../mood-core/models';

export interface RealtimeConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  enableHeartbeat: boolean;
}

export interface RealtimeEvent {
  type: 'mood_created' | 'mood_updated' | 'mood_deleted' | 'user_updated' | 'sync_completed' | 'error';
  data: any;
  timestamp: string;
  userId: string;
}

export interface RealtimeSubscription {
  id: string;
  type: string;
  callback: (event: RealtimeEvent) => void;
  active: boolean;
}

export class RealtimeService {
  private config: RealtimeConfig;
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      enableHeartbeat: true,
      ...config,
    };
  }

  /**
   * Connect to real-time service
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('Real-time service connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = () => {
          console.log('Real-time service disconnected');
          this.isConnected = false;
          this.stopHeartbeat();
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('Real-time service error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from real-time service
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.clearReconnectTimer();
  }

  /**
   * Subscribe to real-time events
   */
  subscribe(
    type: string,
    callback: (event: RealtimeEvent) => void
  ): string {
    const id = this.generateSubscriptionId();
    const subscription: RealtimeSubscription = {
      id,
      type,
      callback,
      active: true,
    };

    this.subscriptions.set(id, subscription);

    // Send subscription message to server
    if (this.isConnected && this.ws) {
      this.send({
        type: 'subscribe',
        data: { type },
      });
    }

    return id;
  }

  /**
   * Unsubscribe from real-time events
   */
  unsubscribe(id: string): boolean {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(id);

      // Send unsubscribe message to server
      if (this.isConnected && this.ws) {
        this.send({
          type: 'unsubscribe',
          data: { id },
        });
      }

      return true;
    }
    return false;
  }

  /**
   * Subscribe to mood updates
   */
  subscribeToMoodUpdates(callback: (mood: MoodEntry) => void): string {
    return this.subscribe('mood_updated', (event) => {
      callback(event.data);
    });
  }

  /**
   * Subscribe to mood creation
   */
  subscribeToMoodCreation(callback: (mood: MoodEntry) => void): string {
    return this.subscribe('mood_created', (event) => {
      callback(event.data);
    });
  }

  /**
   * Subscribe to mood deletion
   */
  subscribeToMoodDeletion(callback: (moodId: string) => void): string {
    return this.subscribe('mood_deleted', (event) => {
      callback(event.data.id);
    });
  }

  /**
   * Subscribe to user updates
   */
  subscribeToUserUpdates(callback: (user: User) => void): string {
    return this.subscribe('user_updated', (event) => {
      callback(event.data);
    });
  }

  /**
   * Subscribe to sync completion
   */
  subscribeToSyncCompletion(callback: (result: any) => void): string {
    return this.subscribe('sync_completed', (event) => {
      callback(event.data);
    });
  }

  /**
   * Send message to server
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'pong') {
        // Heartbeat response
        return;
      }

      // Notify subscribers
      for (const subscription of this.subscriptions.values()) {
        if (subscription.active && subscription.type === data.type) {
          subscription.callback(data);
        }
      }
    } catch (error) {
      console.error('Failed to parse real-time message:', error);
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    if (!this.config.enableHeartbeat) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send({ type: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
      this.connect().catch(console.error);
    }, this.config.reconnectInterval);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    subscriptions: number;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: this.subscriptions.size,
    };
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void {
    this.subscriptions.clear();
  }
}
