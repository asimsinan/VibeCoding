/**
 * Session Manager Service
 * Handles user session management with JWT token validation
 */

import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { User } from '../../models/User';
import { firestoreService } from '../database/FirestoreService';
import { AuthenticationError } from '../../utils/errors';

export interface SessionData {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export class SessionManager {
  private currentSession: SessionData | null = null;
  private auth = getAuth();
  private authStateListener: (() => void) | null = null;

  /**
   * Initialize session from Firebase Auth state
   */
  public async initializeSession(): Promise<SessionData | null> {
    const firebaseUser = this.auth.currentUser;
    
    if (!firebaseUser) {
      this.currentSession = null;
      return null;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const user = await firestoreService.getUser(firebaseUser.uid);

      if (!user) {
        throw new AuthenticationError('User not found in database');
      }

      const sessionData: SessionData = {
        user,
        token,
        refreshToken: firebaseUser.refreshToken || '',
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      };

      this.currentSession = sessionData;
      return sessionData;
    } catch (error) {
      this.currentSession = null;
      throw error;
    }
  }

  /**
   * Get current session
   */
  public getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.currentSession?.user || null;
  }

  /**
   * Get current token
   */
  public async getCurrentToken(): Promise<string | null> {
    if (!this.currentSession) {
      return null;
    }

    // Refresh token if expired
    if (this.currentSession.expiresAt < new Date()) {
      await this.refreshSession();
    }

    return this.currentSession.token;
  }

  /**
   * Refresh current session token
   */
  public async refreshSession(): Promise<SessionData | null> {
    const firebaseUser = this.auth.currentUser;
    
    if (!firebaseUser) {
      this.currentSession = null;
      return null;
    }

    try {
      const token = await firebaseUser.getIdToken(true); // Force refresh
      const sessionData: SessionData = {
        ...this.currentSession!,
        token,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };

      this.currentSession = sessionData;
      return sessionData;
    } catch (error) {
      this.currentSession = null;
      throw new AuthenticationError('Failed to refresh session');
    }
  }

  /**
   * Clear current session
   */
  public clearSession(): void {
    this.currentSession = null;
  }

  /**
   * Start listening to auth state changes
   */
  public startAuthStateListener(
    onAuthChange: (session: SessionData | null) => void
  ): void {
    this.stopAuthStateListener();

    this.authStateListener = onAuthStateChanged(
      this.auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const session = await this.initializeSession();
            onAuthChange(session);
          } catch (error) {
            onAuthChange(null);
          }
        } else {
          this.clearSession();
          onAuthChange(null);
        }
      }
    );
  }

  /**
   * Stop listening to auth state changes
   */
  public stopAuthStateListener(): void {
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Validate session token
   */
  public async validateSession(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    if (this.currentSession.expiresAt < new Date()) {
      try {
        await this.refreshSession();
        return this.currentSession !== null;
      } catch {
        return false;
      }
    }

    return true;
  }
}

export const sessionManager = new SessionManager();

