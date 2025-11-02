/**
 * Authentication Service
 * Handles user authentication with Firebase
 * FR-009: Firebase Authentication implementation
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFirebaseAuth } from '../../config/firebase';
import { User } from '../../models/User';
import { firestoreService } from '../database/FirestoreService';
import { ValidationError, AuthenticationError, handleError } from '../../utils/errors';
import { Validators } from '../../utils/validation';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: string;
}

export class AuthService {
  private getAuth() {
    return getFirebaseAuth();
  }

  // Consolidated initialization and error handling
  private async ensureFirestoreInitialized(): Promise<void> {
    await firestoreService.initialize();
  }

  private handleAuthError(error: unknown): never {
    if (error instanceof ValidationError) {
      throw error;
    }
    const appError = handleError(error);
    if ((error as any)?.code === 'auth/email-already-in-use') {
      throw new ValidationError('User already exists');
    }
    if ((error as any)?.code === 'auth/invalid-credential' || (error as any)?.code === 'auth/wrong-password') {
      throw new AuthenticationError('Invalid credentials');
    }
    throw appError;
  }

  private async createAuthResponse(firebaseUser: any, user: User): Promise<AuthResponse> {
    const token = await firebaseUser.getIdToken();
    const refreshToken = firebaseUser.refreshToken || '';

    return {
      user,
      token,
      refreshToken,
      expiresIn: '3600',
    };
  }

  /**
   * Register a new user
   * Security: Enhanced password validation and input sanitization
   * 
   * @param email - User email address
   * @param password - User password (minimum 8 characters, mixed case recommended)
   * @param displayName - User display name
   * @returns Authentication response with user and token
   * @throws ValidationError if input is invalid
   * @throws AuthenticationError if registration fails
   */
  public async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse> {
    try {
      // Validate and sanitize input using shared validators
      const validatedEmail = Validators.email(email);
      const validatedDisplayName = Validators.displayName(displayName);
      
      // Enhanced password validation
      if (!password || password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters');
      }
      
      // Check for common weak passwords (basic check)
      const weakPasswords = ['password', '12345678', 'password123', 'qwerty123'];
      if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
        throw new ValidationError('Password is too weak. Please choose a stronger password.');
      }

      // Create Firebase user
      await this.ensureFirestoreInitialized();
      const auth = this.getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        validatedEmail,
        password
      );
      const firebaseUser = userCredential.user;

      // Create User model
      const user = new User(
        firebaseUser.uid,
        validatedEmail,
        validatedDisplayName,
        'en',
        [],
        new Date(),
        new Date()
      );

      await firestoreService.createUser(user);

      return await this.createAuthResponse(firebaseUser, user);
    } catch (error: unknown) {
      this.handleAuthError(error);
    }
  }

  /**
   * Login user
   * Security: Enhanced validation and error handling to prevent information leakage
   * 
   * @param email - User email address
   * @param password - User password
   * @returns Authentication response with user and token
   * @throws ValidationError if input is invalid
   * @throws AuthenticationError if login fails
   */
  public async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Validate and sanitize input using shared validators
      const validatedEmail = Validators.email(email);
      
      // Enhanced password validation
      if (!password || password.trim().length === 0) {
        throw new ValidationError('Password is required');
      }
      
      // Rate limiting consideration: In production, add rate limiting here
      // to prevent brute force attacks

      await this.ensureFirestoreInitialized();
      const auth = this.getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        validatedEmail,
        password
      );
      const firebaseUser = userCredential.user;

      await this.ensureFirestoreInitialized();
      let user = await this.getOrCreateUser(firebaseUser, email);

      return await this.createAuthResponse(firebaseUser, user);
    } catch (error: unknown) {
      this.handleAuthError(error);
    }
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      const auth = this.getAuth();
      await signOut(auth);
    } catch (error: unknown) {
      throw handleError(error);
    }
  }

  // Extracted helper method for user management
  private async getOrCreateUser(firebaseUser: any, email: string): Promise<User> {
    let user = await firestoreService.getUser(firebaseUser.uid);

    if (!user) {
      user = new User(
        firebaseUser.uid,
        firebaseUser.email || email,
        firebaseUser.displayName || 'User',
        'en'
      );
      await firestoreService.createUser(user);
    } else {
      // Ensure user is a User instance (Firestore might return plain object)
      if (!(user instanceof User)) {
        user = User.fromJSON(user as any);
      }
      
      // Update last login timestamp
      if (user && typeof user.updateLastLogin === 'function') {
        user.updateLastLogin();
        await firestoreService.updateUser(user);
      } else {
        // Fallback: manually update lastLoginAt if method doesn't exist
        const userData = user as any;
        userData.lastLoginAt = new Date();
        user = User.fromJSON(userData);
        await firestoreService.updateUser(user);
      }
    }

    return user;
  }
}

export const authService = new AuthService();

