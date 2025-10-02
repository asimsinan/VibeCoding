// Notification API Contracts
// FR-005: System MUST provide real-time notifications for purchase confirmations and listing updates

export interface NotificationApiContract {
  // GET /api/v1/notifications
  getNotifications(params: GetNotificationsParams): Promise<GetNotificationsResponse>;
  
  // GET /api/v1/notifications/{id}
  getNotification(id: string): Promise<Notification>;
  
  // PUT /api/v1/notifications/{id}/read
  markAsRead(id: string): Promise<Notification>;
  
  // PUT /api/v1/notifications/read-all
  markAllAsRead(): Promise<void>;
  
  // DELETE /api/v1/notifications/{id}
  deleteNotification(id: string): Promise<void>;
  
  // GET /api/v1/notifications/preferences
  getNotificationPreferences(): Promise<NotificationPreferences>;
  
  // PUT /api/v1/notifications/preferences
  updateNotificationPreferences(request: UpdateNotificationPreferencesRequest): Promise<NotificationPreferences>;
  
  // GET /api/v1/notifications/unread-count
  getUnreadCount(): Promise<UnreadCountResponse>;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  pagination: Pagination;
}

export interface UpdateNotificationPreferencesRequest {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  transactionNotifications?: boolean;
  productNotifications?: boolean;
  orderNotifications?: boolean;
  systemNotifications?: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationType {
  type: 'purchase_confirmation' | 'sale_confirmation' | 'product_sold' | 'order_shipped' | 'order_delivered' | 'payment_received' | 'listing_updated' | 'system_alert';
  category: 'transaction' | 'product' | 'order' | 'system';
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  transactionNotifications: boolean;
  productNotifications: boolean;
  orderNotifications: boolean;
  systemNotifications: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}
