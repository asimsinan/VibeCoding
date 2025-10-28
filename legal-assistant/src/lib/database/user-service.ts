import { getPrismaClient } from './prisma-client';
import type { User } from '@prisma/client';

export class UserService {
  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const prisma = getPrismaClient();
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const prisma = getPrismaClient();
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    name?: string;
    passwordHash?: string;
  }): Promise<User> {
    const prisma = getPrismaClient();
    return prisma.user.create({
      data,
    });
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: Partial<Pick<User, 'name' | 'email' | 'passwordHash'>>): Promise<User> {
    const prisma = getPrismaClient();
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.user.delete({
      where: { id },
    });
  }
}

export const userService = new UserService();

