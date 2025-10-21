import { PrismaClient } from '@prisma/client';
import { PasswordValidator } from '../auth/password-validator';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password?: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  passwordHash?: string;
}

export interface UserQueryOptions {
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'email';
  orderDirection?: 'asc' | 'desc';
}

export class UserModel {
  private prisma: PrismaClient;
  private passwordValidator: PasswordValidator;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.passwordValidator = new PasswordValidator();
  }

  async create(userData: CreateUserData): Promise<User> {
    // Validate required fields
    if (!userData.email) {
      throw new Error('Email is required');
    }
    if (!userData.firstName) {
      throw new Error('First name is required');
    }
    if (!userData.lastName) {
      throw new Error('Last name is required');
    }

    // Hash password if it's not already hashed
    let passwordHash = userData.passwordHash;
    if (!passwordHash && userData.password) {
      passwordHash = await this.passwordValidator.hash(userData.password);
    } else if (passwordHash && !passwordHash.startsWith('$2')) {
      passwordHash = await this.passwordValidator.hash(userData.password || '');
    }

    if (!passwordHash) {
      throw new Error('Password or password hash is required');
    }

    // Validate email format
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName
      }
    });

    return this.mapPrismaUser(user);
  }

  async findById(id: string): Promise<User | null> {
    if (!id) {
      throw new Error('User ID is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    return user ? this.mapPrismaUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new Error('Email is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    return user ? this.mapPrismaUser(user) : null;
  }

  async findAll(options: UserQueryOptions = {}): Promise<User[]> {
    const {
      page = 1,
      limit = 10,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const orderByClause = { [orderBy]: orderDirection };

    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: orderByClause
    });

    return users.map(user => this.mapPrismaUser(user));
  }

  async update(id: string, updateData: UpdateUserData): Promise<User> {
    if (!id) {
      throw new Error('User ID is required');
    }

    // Validate email if provided
    if (updateData.email && !this.isValidEmail(updateData.email)) {
      throw new Error('Invalid email format');
    }

    // Check if email already exists (excluding current user)
    if (updateData.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('User with this email already exists');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData
    });

    return this.mapPrismaUser(user);
  }

  async updatePassword(id: string, newPasswordHash: string): Promise<User> {
    if (!id) {
      throw new Error('User ID is required');
    }
    if (!newPasswordHash) {
      throw new Error('New password hash is required');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash }
    });

    return this.mapPrismaUser(user);
  }

  async delete(id: string): Promise<User> {
    if (!id) {
      throw new Error('User ID is required');
    }

    const user = await this.prisma.user.delete({
      where: { id }
    });

    return this.mapPrismaUser(user);
  }

  async isEmailUnique(email: string): Promise<boolean> {
    if (!email) {
      throw new Error('Email is required');
    }

    const user = await this.findByEmail(email);
    return user === null;
  }

  async verifyPassword(id: string, password: string): Promise<boolean> {
    if (!id) {
      throw new Error('User ID is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }

    const user = await this.findById(id);
    if (!user) {
      return false;
    }

    return this.passwordValidator.verify(password, user.passwordHash);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<User> {
    if (!id) {
      throw new Error('User ID is required');
    }
    if (!currentPassword) {
      throw new Error('Current password is required');
    }
    if (!newPassword) {
      throw new Error('New password is required');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(id, currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const validation = this.passwordValidator.validate(newPassword);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Hash new password
    const newPasswordHash = await this.passwordValidator.hash(newPassword);

    // Update password
    return this.updatePassword(id, newPasswordHash);
  }

  async getPasswordHistory(id: string, limit: number = 5): Promise<string[]> {
    if (!id) {
      throw new Error('User ID is required');
    }

    // In a real implementation, you would have a password_history table
    // For now, we'll return an empty array as this is a simplified implementation
    return [];
  }

  async addPasswordToHistory(id: string, passwordHash: string): Promise<void> {
    if (!id) {
      throw new Error('User ID is required');
    }
    if (!passwordHash) {
      throw new Error('Password hash is required');
    }

    // In a real implementation, you would store this in a password_history table
    // For now, this is a placeholder
  }

  async getLastPasswordChange(id: string): Promise<Date | null> {
    if (!id) {
      throw new Error('User ID is required');
    }

    const user = await this.findById(id);
    return user ? user.updatedAt : null;
  }

  async searchUsers(query: string, options: UserQueryOptions = {}): Promise<User[]> {
    if (!query) {
      throw new Error('Search query is required');
    }

    const {
      page = 1,
      limit = 10,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const orderByClause = { [orderBy]: orderDirection };

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } }
        ]
      },
      skip,
      take: limit,
      orderBy: orderByClause
    });

    return users.map(user => this.mapPrismaUser(user));
  }

  async getUserCount(): Promise<number> {
    return this.prisma.user.count();
  }

  async getUsersByDateRange(startDate: Date, endDate: Date): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return users.map(user => this.mapPrismaUser(user));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private mapPrismaUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  // Method to get Prisma client for advanced queries
  getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}
