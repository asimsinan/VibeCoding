import type { CreateUserInput, UpdateUserInput, UserWithoutPassword } from '../models/User';
export declare class UserService {
    createUser(input: CreateUserInput): Promise<UserWithoutPassword>;
    findUserByEmail(email: string): Promise<UserWithoutPassword | null>;
    findUserById(id: string): Promise<UserWithoutPassword | null>;
    updateUser(id: string, input: UpdateUserInput): Promise<UserWithoutPassword>;
    deleteUser(id: string): Promise<void>;
    verifyPassword(email: string, password: string): Promise<boolean>;
}
//# sourceMappingURL=UserService.d.ts.map