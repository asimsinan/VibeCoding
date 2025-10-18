import { User as PrismaUser } from '@prisma/client';
/**
 * User Model
 * Represents a user account in the system
 */
export interface User extends PrismaUser {
}
export type UserRole = 'user' | 'admin';
export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
}
export interface UpdateUserInput {
    email?: string;
    name?: string;
    role?: UserRole;
}
export interface UserWithoutPassword extends Omit<PrismaUser, 'password'> {
}
//# sourceMappingURL=User.d.ts.map