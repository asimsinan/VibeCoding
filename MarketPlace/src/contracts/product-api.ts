// Product API Contracts
// FR-002: System MUST allow users to create, edit, and delete product listings with image uploads

export interface ProductApiContract {
  // GET /api/v1/products
  getProducts(params: GetProductsParams): Promise<GetProductsResponse>;
  
  // POST /api/v1/products
  createProduct(request: CreateProductRequest): Promise<Product>;
  
  // GET /api/v1/products/{id}
  getProduct(id: string): Promise<Product>;
  
  // PUT /api/v1/products/{id}
  updateProduct(id: string, request: UpdateProductRequest): Promise<Product>;
  
  // DELETE /api/v1/products/{id}
  deleteProduct(id: string): Promise<void>;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface GetProductsResponse {
  products: Product[];
  pagination: Pagination;
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

export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
}

export interface UpdateProductRequest {
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
  category?: string;
  isAvailable?: boolean;
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
