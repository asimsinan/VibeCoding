import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { CreateUserInput, UpdateUserInput, UserWithoutPassword } from '../models/User.js';
import { validateEmail, validatePassword } from '../utils/validation.js';

const prisma = new PrismaClient();

export class UserService {
  async createUser(input: CreateUserInput): Promise<UserWithoutPassword> {
    // Validate input
    if (!validateEmail(input.email)) {
      throw new Error('Invalid email format');
    }
    
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.valid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: input.role || 'user',
      },
    });

    // Return without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserByEmail(email: string): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserById(id: string): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<UserWithoutPassword> {
    const user = await prisma.user.update({
      where: { id },
      data: input,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return false;

    return bcrypt.compare(password, user.password);
  }
}

