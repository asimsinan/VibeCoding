/**
 * Security Middleware
 * Provides route protection and authorization checks
 */

import { sessionManager, SessionData } from './SessionManager';
import { roleBasedAccess, Permission, UserRole } from './RoleBasedAccess';
import { AuthorizationError } from '../../utils/errors';

export interface SecurityContext {
  session: SessionData;
  userId: string;
  userRole: UserRole;
  permissions: Permission[];
}

export class SecurityMiddleware {
  /**
   * Require authentication - middleware to check if user is authenticated
   */
  public async requireAuthentication(): Promise<SecurityContext> {
    const session = sessionManager.getCurrentSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Validate session is still valid
    const isValid = await sessionManager.validateSession();
    if (!isValid) {
      throw new AuthorizationError('Session expired');
    }

    const userRole = roleBasedAccess.getUserRole(session.user);
    const permissions = roleBasedAccess.getUserPermissions(session.user);

    return {
      session,
      userId: session.user.uid,
      userRole,
      permissions,
    };
  }

  /**
   * Require specific permission
   */
  public async requirePermission(permission: Permission): Promise<SecurityContext> {
    const context = await this.requireAuthentication();

    if (!context.permissions.includes(permission)) {
      throw new AuthorizationError(`Permission denied: ${permission}`);
    }

    return context;
  }

  /**
   * Require any of the specified permissions
   */
  public async requireAnyPermission(
    permissions: Permission[]
  ): Promise<SecurityContext> {
    const context = await this.requireAuthentication();

    if (!roleBasedAccess.hasAnyPermission(context.session.user, permissions)) {
      throw new AuthorizationError(
        `Permission denied: requires one of [${permissions.join(', ')}]`
      );
    }

    return context;
  }

  /**
   * Require all of the specified permissions
   */
  public async requireAllPermissions(
    permissions: Permission[]
  ): Promise<SecurityContext> {
    const context = await this.requireAuthentication();

    if (!roleBasedAccess.hasAllPermissions(context.session.user, permissions)) {
      throw new AuthorizationError(
        `Permission denied: requires all of [${permissions.join(', ')}]`
      );
    }

    return context;
  }

  /**
   * Require specific role
   */
  public async requireRole(role: UserRole): Promise<SecurityContext> {
    const context = await this.requireAuthentication();

    if (context.userRole !== role) {
      throw new AuthorizationError(`Role required: ${role}`);
    }

    return context;
  }

  /**
   * Require any of the specified roles
   */
  public async requireAnyRole(roles: UserRole[]): Promise<SecurityContext> {
    const context = await this.requireAuthentication();

    if (!roles.includes(context.userRole)) {
      throw new AuthorizationError(
        `Role required: one of [${roles.join(', ')}]`
      );
    }

    return context;
  }

  /**
   * Optional authentication - returns context if authenticated, null otherwise
   */
  public async optionalAuthentication(): Promise<SecurityContext | null> {
    try {
      return await this.requireAuthentication();
    } catch {
      return null;
    }
  }

  /**
   * Check if current user owns a resource
   */
  public async requireOwnership(resourceUserId: string): Promise<SecurityContext> {
    const context = await this.requireAuthentication();

    // Admins can access any resource
    if (context.userRole === 'admin') {
      return context;
    }

    // Regular users can only access their own resources
    if (context.userId !== resourceUserId) {
      throw new AuthorizationError('Access denied: resource ownership required');
    }

    return context;
  }
}

export const securityMiddleware = new SecurityMiddleware();

