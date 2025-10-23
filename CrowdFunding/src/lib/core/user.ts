import bcrypt from 'bcryptjs';

export class UserCore {
  private readonly SALT_ROUNDS = 12;

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Validate user profile data
   */
  validateUserProfile(profile: {
    name: string;
    bio?: string;
    avatar?: string;
    location?: string;
  }): boolean {
    // Name is required and must be between 1-100 characters
    if (!profile.name || profile.name.length < 1 || profile.name.length > 100) {
      return false;
    }

    // Bio is optional but if provided, must be <= 500 characters
    if (profile.bio && profile.bio.length > 500) {
      return false;
    }

    // Avatar URL validation (basic)
    if (profile.avatar && !this.isValidUrl(profile.avatar)) {
      return false;
    }

    return true;
  }

  /**
   * Calculate user statistics
   */
  calculateUserStats(userData: {
    campaigns: Array<{ goal: number; current: number }>;
    donations: Array<{ amount: number }>;
  }) {
    const totalCampaigns = userData.campaigns.length;
    const successfulCampaigns = userData.campaigns.filter(c => c.current >= c.goal).length;
    const totalRaised = userData.campaigns.reduce((sum, c) => sum + c.current, 0);
    const totalDonated = userData.donations.reduce((sum, d) => sum + d.amount, 0);
    const averageCampaignGoal = totalCampaigns > 0 
      ? userData.campaigns.reduce((sum, c) => sum + c.goal, 0) / totalCampaigns 
      : 0;

    return {
      totalCampaigns,
      successfulCampaigns,
      totalRaised,
      totalDonated,
      averageCampaignGoal
    };
  }

  /**
   * Generate user slug from name
   */
  generateUserSlug(name: string, userId?: string): string {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/-$/, ''); // Remove trailing hyphen

    // Add userId if provided to ensure uniqueness
    if (userId) {
      slug += `-${userId}`;
    }

    return slug;
  }

  /**
   * Validate user role
   */
  validateUserRole(role: string): boolean {
    const validRoles = ['USER', 'ADMIN', 'MODERATOR'];
    return validRoles.includes(role);
  }

  /**
   * Check user permissions for specific actions
   */
  checkUserPermissions(user: { role: string }, action: string): boolean {
    const permissions = {
      'ADMIN': ['CREATE_CAMPAIGN', 'EDIT_CAMPAIGN', 'DELETE_CAMPAIGN', 'MODERATE_COMMENTS', 'MANAGE_USERS'],
      'MODERATOR': ['CREATE_CAMPAIGN', 'EDIT_CAMPAIGN', 'MODERATE_COMMENTS'],
      'USER': ['CREATE_CAMPAIGN', 'EDIT_OWN_CAMPAIGN', 'DELETE_OWN_CAMPAIGN', 'MAKE_DONATION', 'COMMENT']
    };

    const userPermissions = permissions[user.role as keyof typeof permissions] || [];
    return userPermissions.includes(action);
  }

  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeUserInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .trim();
  }

  /**
   * Check if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
