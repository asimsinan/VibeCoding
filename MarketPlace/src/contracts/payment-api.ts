// Payment API Contracts
// FR-004: System MUST integrate with Stripe for secure payment processing and transaction management

export interface PaymentApiContract {
  // POST /api/v1/payments/intent
  createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntent>;
  
  // POST /api/v1/payments/confirm
  confirmPaymentIntent(request: ConfirmPaymentIntentRequest): Promise<PaymentIntent>;
  
  // POST /api/v1/payments/cancel
  cancelPaymentIntent(request: CancelPaymentIntentRequest): Promise<PaymentIntent>;
  
  // GET /api/v1/payments/intent/{id}
  getPaymentIntent(id: string): Promise<PaymentIntent>;
  
  // POST /api/v1/orders
  createOrder(request: CreateOrderRequest): Promise<Order>;
  
  // GET /api/v1/orders/{id}
  getOrder(id: string): Promise<Order>;
  
  // PUT /api/v1/orders/{id}/status
  updateOrderStatus(id: string, request: UpdateOrderStatusRequest): Promise<Order>;
  
  // GET /api/v1/orders
  getUserOrders(params: GetUserOrdersParams): Promise<GetUserOrdersResponse>;
  
  // POST /api/v1/payments/refund
  refundPayment(request: RefundPaymentRequest): Promise<RefundResponse>;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface ConfirmPaymentIntentRequest {
  paymentIntentId: string;
  paymentMethodId: string;
}

export interface CancelPaymentIntentRequest {
  paymentIntentId: string;
}

export interface CreateOrderRequest {
  productId: string;
  amount: number;
  currency: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface GetUserOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface GetUserOrdersResponse {
  orders: Order[];
  pagination: Pagination;
}

export interface RefundPaymentRequest {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret: string;
  orderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStatus {
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  lastUpdated: Date;
}

export interface Order {
  id: string;
  buyer: User;
  seller: User;
  product: Product;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderStatus {
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  lastUpdated: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  seller: User;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  createdAt: Date;
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
