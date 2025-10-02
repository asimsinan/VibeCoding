// Database Types
// TypeScript type definitions for database models

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile | null;
  products?: Product[];
  ordersAsBuyer?: Order[];
  ordersAsSeller?: Order[];
  notifications?: Notification[];
  imageUploads?: ImageUpload[];
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  user?: User; // Optional relation
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number | any; // Prisma Decimal type
  images: string[];
  category: string;
  sellerId: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  seller: User;
  orders?: Order[];
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  amount: number | any; // Prisma Decimal type
  currency: string;
  status: string; // OrderStatusEnum
  paymentIntentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  buyer: User;
  seller: User;
  product: Product;
}

export interface OrderStatus {
  id: string;
  orderId: string;
  status: string;
  lastUpdated: Date;
  order: Order;
}

export interface Notification {
  id: string;
  userId: string;
  type: string; // NotificationTypeEnum
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  user: User;
}

export interface NotificationType {
  id: string;
  type: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: Date;
  parent?: Category;
  children?: Category[];
}

export interface ImageUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  createdAt: Date;
  user: User;
}

export interface PaymentIntent {
  id: string;
  stripeId: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  stripeId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  createdAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  transactionNotifications: boolean;
  productNotifications: boolean;
  orderNotifications: boolean;
  systemNotifications: boolean;
  user: User;
}

export type OrderStatusEnum = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type NotificationTypeEnum = 'PURCHASE_CONFIRMATION' | 'SALE_CONFIRMATION' | 'PRODUCT_SOLD' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'PAYMENT_RECEIVED' | 'LISTING_UPDATED' | 'SYSTEM_ALERT';
export type NotificationCategoryEnum = 'TRANSACTION' | 'PRODUCT' | 'ORDER' | 'SYSTEM';
export type PaymentStatusEnum = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type RefundStatusEnum = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

// Extended types with relations
export interface UserWithProfile extends User {
  profile: UserProfile;
  preferences?: UserPreferences;
}

export interface UserWithRelations extends User {
  profile: UserProfile;
  preferences?: UserPreferences;
  products: Product[];
  ordersAsBuyer: Order[];
  ordersAsSeller: Order[];
  notifications: Notification[];
  imageUploads: ImageUpload[];
}

export interface ProductWithSeller extends Product {
  seller: UserWithProfile;
}

export interface ProductWithRelations extends Product {
  seller: UserWithProfile;
  orders: Order[];
}

export interface OrderWithRelations extends Order {
  buyer: UserWithProfile;
  seller: UserWithProfile;
  product: ProductWithSeller;
}

export interface NotificationWithUser extends Notification {
  user: UserWithProfile;
}

// Database query types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

// SortParams, FilterParams, and PaginatedResponse are defined in api.ts
export interface QueryParams {
  pagination?: PaginationParams;
  sort?: import('./api').SortParams;
  filters?: import('./api').FilterParams;
}

export interface DatabaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Database transaction types
export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
}

export interface DatabaseTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  execute<T>(fn: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
}

// Input types for creating/updating models
export interface CreateUserInput {
  username: string;
  email: string;
  passwordHash: string;
  profile: CreateUserProfileInput;
  preferences?: CreateUserPreferencesInput;
}

export interface CreateUserProfileInput {
  firstName: string;
  lastName: string;
  bio?: string;
  location?: string;
  phone?: string;
  avatar?: string;
}

export interface CreateUserPreferencesInput {
  email: boolean;
  push: boolean;
  sms: boolean;
  transactionNotifications: boolean;
  productNotifications: boolean;
  orderNotifications: boolean;
  systemNotifications: boolean;
}

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
}

export interface CreateOrderInput {
  buyerId: string;
  sellerId: string;
  productId: string;
  amount: number;
  currency: string;
  paymentIntentId?: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationTypeEnum;
  title: string;
  message: string;
  data?: any;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
}

export interface CreateImageUploadInput {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
}

export interface CreatePaymentIntentInput {
  stripeId: string;
  amount: number;
  currency: string;
  status: PaymentStatusEnum;
  clientSecret: string;
  orderId?: string;
}

export interface CreateRefundInput {
  stripeId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: RefundStatusEnum;
  reason?: string;
}

// Update input types
export interface UpdateUserInput {
  username?: string;
  email?: string;
  passwordHash?: string;
  isActive?: boolean;
}

export interface UpdateUserProfileInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  phone?: string;
  avatar?: string;
}

export interface UpdateUserPreferencesInput {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  transactionNotifications?: boolean;
  productNotifications?: boolean;
  orderNotifications?: boolean;
  systemNotifications?: boolean;
}

export interface UpdateProductInput {
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
  category?: string;
  isAvailable?: boolean;
}

export interface UpdateOrderInput {
  status?: OrderStatusEnum;
  paymentIntentId?: string;
}

export interface UpdateNotificationInput {
  isRead?: boolean;
  readAt?: Date;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentId?: string;
}

export interface UpdatePaymentIntentInput {
  status?: PaymentStatusEnum;
  clientSecret?: string;
}

export interface UpdateRefundInput {
  status?: RefundStatusEnum;
  reason?: string;
}