/**
 * Role-Based Access Control (RBAC)
 * Manages user roles and permissions
 */

import { User } from '../../models/User';

export type UserRole = 'user' | 'admin' | 'premium';
export type Permission = 
  | 'scan:create'
  | 'scan:read'
  | 'scan:delete'
  | 'scan:history'
  | 'alternatives:view'
  | 'admin:users'
  | 'admin:scans'
  | 'premium:unlimited'
  | 'premium:advanced-analytics';

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'scan:create',
    'scan:read',
    'scan:delete',
    'scan:history',
    'alternatives:view',
  ],
  premium: [
    'scan:create',
    'scan:read',
    'scan:delete',
    'scan:history',
    'alternatives:view',
    'premium:unlimited',
    'premium:advanced-analytics',
  ],
  admin: [
    'scan:create',
    'scan:read',
    'scan:delete',
    'scan:history',
    'alternatives:view',
    'admin:users',
    'admin:scans',
  ],
};

export class RoleBasedAccess {
  /**
   * Get user role (defaults to 'user')
   */
  public getUserRole(user: User): UserRole {
    // In a real app, this would come from user metadata or a role field
    // For now, we check if user has admin flag or premium flag in preferences
    if (user.preferences?.isAdmin === true) {
      return 'admin';
    }
    if (user.preferences?.isPremium === true) {
      return 'premium';
    }
    return 'user';
  }

  /**
   * Get permissions for a role
   */
  public getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
  }

  /**
   * Get permissions for a user
   */
  public getUserPermissions(user: User): Permission[] {
    const role = this.getUserRole(user);
    return this.getRolePermissions(role);
  }

  /**
   * Check if user has a specific permission
   */
  public hasPermission(user: User, permission: Permission): boolean {
    const permissions = this.getUserPermissions(user);
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  public hasAnyPermission(user: User, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  public hasAllPermissions(user: User, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has a specific role
   */
  public hasRole(user: User, role: UserRole): boolean {
    return this.getUserRole(user) === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasAnyRole(user: User, roles: UserRole[]): boolean {
    const userRole = this.getUserRole(user);
    return roles.includes(userRole);
  }

  /**
   * Require permission - throws if user doesn't have it
   */
  public requirePermission(user: User, permission: Permission): void {
    if (!this.hasPermission(user, permission)) {
      throw new Error(`User does not have permission: ${permission}`);
    }
  }

  /**
   * Require role - throws if user doesn't have it
   */
  public requireRole(user: User, role: UserRole): void {
    if (!this.hasRole(user, role)) {
      throw new Error(`User does not have role: ${role}`);
    }
  }
}

export const roleBasedAccess = new RoleBasedAccess();

