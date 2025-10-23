import bcrypt from 'bcryptjs';
import { UserRepository } from '../../repositories/UserRepository';
import { generateToken, verifyToken, TokenPayload } from '../utils/jwt';

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
  user?: any;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async login(email: string, password: string): Promise<ServiceResult<AuthResult>> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid credentials' };
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  async register(data: RegisterData): Promise<ServiceResult<AuthResult>> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await this.userRepository.create({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'USER'
      });

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  }

  async verifyToken(token: string): Promise<ServiceResult<{ user: AuthResult['user'] }>> {
    try {
      const payload = verifyToken(token);
      const user = await this.userRepository.findById(payload.userId);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error: any) {
      if (error.message === 'Token expired') {
        return { success: false, error: 'Token expired' };
      }
      return { success: false, error: 'Invalid token' };
    }
  }

  async refreshToken(userId: string): Promise<ServiceResult<AuthResult>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      return { success: false, error: 'Token refresh failed' };
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ServiceResult<{ success: boolean }>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.update(userId, { password: hashedNewPassword });

      return { success: true, data: { success: true } };
    } catch (error) {
      return { success: false, error: 'Password change failed' };
    }
  }
}
