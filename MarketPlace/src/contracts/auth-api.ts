// Authentication API Contracts
// FR-001: System MUST provide user authentication and registration with secure password handling

export interface AuthApiContract {
  // POST /api/v1/auth/register
  register(request: RegisterRequest): Promise<AuthResponse>;
  
  // POST /api/v1/auth/login
  login(request: LoginRequest): Promise<AuthResponse>;
  
  // POST /api/v1/auth/refresh
  refreshToken(request: RefreshTokenRequest): Promise<AuthResponse>;
  
  // POST /api/v1/auth/logout
  logout(token: string): Promise<void>;
  
  // GET /api/v1/auth/me
  getCurrentUser(): Promise<User>;
  
  // PUT /api/v1/auth/profile
  updateProfile(request: UpdateProfileRequest): Promise<User>;
  
  // PUT /api/v1/auth/password
  changePassword(request: ChangePasswordRequest): Promise<void>;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
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

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}
