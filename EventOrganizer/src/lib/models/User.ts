import { z } from 'zod'

/**
 * User Model - Core user entity extending Supabase auth.users
 * Traces to FR-001: User authentication and authorization
 */

// User status enum
export const UserStatus = z.enum(['active', 'inactive', 'suspended'])
export type UserStatus = z.infer<typeof UserStatus>

// User role enum
export const UserRole = z.enum(['organizer', 'attendee', 'admin'])
export type UserRole = z.infer<typeof UserRole>

// User preferences schema
export const UserPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']).default('en'),
  timezone: z.enum(['UTC', 'EST', 'PST', 'CST', 'MST', 'GMT', 'CET', 'JST', 'AEST', 'IST']).default('UTC'),
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  privacyLevel: z.enum(['public', 'private', 'friends']).default('public')
})

export type UserPreferences = z.infer<typeof UserPreferencesSchema>

// User metadata schema
export const UserMetadataSchema = z.object({
  company: z.string().max(255).optional(),
  jobTitle: z.string().max(255).optional(),
  location: z.string().max(255).optional(),
  website: z.string().url().optional(),
  socialLinks: z.object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    github: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional()
  }).default({}),
  skills: z.array(z.string().max(100)).max(20).default([]),
  interests: z.array(z.string().max(100)).max(15).default([]),
  customFields: z.record(z.string(), z.any()).default({})
})

export type UserMetadata = z.infer<typeof UserMetadataSchema>

// Base User schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(255),
  passwordHash: z.string().min(1),
  fullName: z.string().min(1).max(100),
  profilePictureUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  role: UserRole.default('attendee'),
  status: UserStatus.default('active'),
  preferences: UserPreferencesSchema.default({}),
  metadata: UserMetadataSchema.default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type User = z.infer<typeof UserSchema>

// Create User schema
export const CreateUserSchema = UserSchema.omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true
}).extend({
  password: z.string().min(8).max(100)
})

export type CreateUserRequest = z.infer<typeof CreateUserSchema>

// Update User schema
export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true
})

export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>

// User list query schema
export const UserListQuerySchema = z.object({
  role: UserRole.optional(),
  status: UserStatus.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['fullName', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeInactive: z.boolean().default(false)
})

export type UserListQuery = z.infer<typeof UserListQuerySchema>

// User search schema
export const UserSearchSchema = z.object({
  query: z.string().min(1).max(100),
  role: UserRole.optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20)
})

export type UserSearchRequest = z.infer<typeof UserSearchSchema>

// User profile schema (public view)
export const UserProfileSchema = UserSchema.omit({
  passwordHash: true
}).extend({
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

export type UserProfile = z.infer<typeof UserProfileSchema>

// User validation methods
export class UserValidator {
  /**
   * Validate email format
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: 'Email is required' }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' }
    }
    
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' }
    }
    
    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' }
    }
    
    if (!/\d/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' }
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one special character' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate full name
   */
  static validateFullName(fullName: string): { isValid: boolean; error?: string } {
    if (!fullName || fullName.trim().length === 0) {
      return { isValid: false, error: 'Full name is required' }
    }
    
    if (fullName.length > 100) {
      return { isValid: false, error: 'Full name cannot exceed 100 characters' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate bio
   */
  static validateBio(bio: string): { isValid: boolean; error?: string } {
    if (bio && bio.length > 500) {
      return { isValid: false, error: 'Bio cannot exceed 500 characters' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate role
   */
  static validateRole(role: UserRole): { isValid: boolean; error?: string } {
    const validRoles = ['organizer', 'attendee', 'admin']
    if (!validRoles.includes(role)) {
      return { isValid: false, error: 'Invalid user role' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate status
   */
  static validateStatus(status: UserStatus): { isValid: boolean; error?: string } {
    const validStatuses = ['active', 'inactive', 'suspended']
    if (!validStatuses.includes(status)) {
      return { isValid: false, error: 'Invalid user status' }
    }
    
    return { isValid: true }
  }

  /**
   * Validate metadata
   */
  static validateMetadata(metadata: UserMetadata): { isValid: boolean; error?: string } {
    if (metadata.skills.length > 20) {
      return { isValid: false, error: 'Cannot have more than 20 skills' }
    }
    
    if (metadata.interests.length > 15) {
      return { isValid: false, error: 'Cannot have more than 15 interests' }
    }
    
    return { isValid: true }
  }

  /**
   * Sanitize input text
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/[&]/g, '&amp;') // Escape ampersands
      .substring(0, 1000) // Limit length
  }
}

// User business logic methods
export class UserService {
  /**
   * Check if user is active
   */
  static isActive(user: User): boolean {
    return user.status === 'active'
  }

  /**
   * Check if user is organizer
   */
  static isOrganizer(user: User): boolean {
    return user.role === 'organizer'
  }

  /**
   * Check if user is admin
   */
  static isAdmin(user: User): boolean {
    return user.role === 'admin'
  }

  /**
   * Check if user can create events
   */
  static canCreateEvents(user: User): boolean {
    return user.role === 'organizer' || user.role === 'admin'
  }

  /**
   * Check if user can manage users
   */
  static canManageUsers(user: User): boolean {
    return user.role === 'admin'
  }

  /**
   * Check if user has email notifications enabled
   */
  static hasEmailNotifications(user: User): boolean {
    return user.preferences.emailNotifications
  }

  /**
   * Check if user has push notifications enabled
   */
  static hasPushNotifications(user: User): boolean {
    return user.preferences.pushNotifications
  }

  /**
   * Check if user has SMS notifications enabled
   */
  static hasSmsNotifications(user: User): boolean {
    return user.preferences.smsNotifications
  }

  /**
   * Get user display name
   */
  static getDisplayName(user: User): string {
    return user.fullName || user.email
  }

  /**
   * Get user profile picture URL
   */
  static getProfilePictureUrl(user: User): string {
    return user.profilePictureUrl || '/default-avatar.png'
  }

  /**
   * Get user bio
   */
  static getBio(user: User): string {
    return user.bio || ''
  }

  /**
   * Get user company
   */
  static getCompany(user: User): string {
    return user.metadata.company || ''
  }

  /**
   * Get user job title
   */
  static getJobTitle(user: User): string {
    return user.metadata.jobTitle || ''
  }

  /**
   * Get user location
   */
  static getLocation(user: User): string {
    return user.metadata.location || ''
  }

  /**
   * Get user website
   */
  static getWebsite(user: User): string {
    return user.metadata.website || ''
  }

  /**
   * Get user social links
   */
  static getSocialLinks(user: User): Record<string, string> {
    return user.metadata.socialLinks || {}
  }

  /**
   * Get user skills
   */
  static getSkills(user: User): string[] {
    return user.metadata.skills || []
  }

  /**
   * Get user interests
   */
  static getInterests(user: User): string[] {
    return user.metadata.interests || []
  }

  /**
   * Get user age in days
   */
  static getAgeDays(user: User): number {
    const now = new Date()
    const createdAt = new Date(user.createdAt)
    return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if user is new (created within last 7 days)
   */
  static isNewUser(user: User): boolean {
    return this.getAgeDays(user) <= 7
  }

  /**
   * Get user role display text
   */
  static getRoleDisplayText(user: User): string {
    switch (user.role) {
      case 'organizer': return 'Organizer'
      case 'attendee': return 'Attendee'
      case 'admin': return 'Admin'
      default: return 'Unknown'
    }
  }

  /**
   * Get user status display text
   */
  static getStatusDisplayText(user: User): string {
    switch (user.status) {
      case 'active': return 'Active'
      case 'inactive': return 'Inactive'
      case 'suspended': return 'Suspended'
      default: return 'Unknown'
    }
  }

  /**
   * Get user privacy level
   */
  static getPrivacyLevel(user: User): string {
    return user.preferences.privacyLevel
  }

  /**
   * Get user language
   */
  static getLanguage(user: User): string {
    return user.preferences.language
  }

  /**
   * Get user timezone
   */
  static getTimezone(user: User): string {
    return user.preferences.timezone
  }

  /**
   * Get user theme
   */
  static getTheme(user: User): string {
    return user.preferences.theme
  }

  /**
   * Check if user has skill
   */
  static hasSkill(user: User, skill: string): boolean {
    return user.metadata.skills.includes(skill)
  }

  /**
   * Check if user has interest
   */
  static hasInterest(user: User, interest: string): boolean {
    return user.metadata.interests.includes(interest)
  }

  /**
   * Get user skill count
   */
  static getSkillCount(user: User): number {
    return user.metadata.skills.length
  }

  /**
   * Get user interest count
   */
  static getInterestCount(user: User): number {
    return user.metadata.interests.length
  }

  /**
   * Get user social link count
   */
  static getSocialLinkCount(user: User): number {
    return Object.keys(user.metadata.socialLinks).length
  }

  /**
   * Get user profile completeness percentage
   */
  static getProfileCompleteness(user: User): number {
    let score = 0
    const maxScore = 100
    
    if (user.fullName) score += 20
    if (user.bio) score += 20
    if (user.metadata.company) score += 15
    if (user.metadata.jobTitle) score += 15
    if (user.metadata.location) score += 10
    if (user.metadata.website) score += 10
    if (user.metadata.skills.length > 0) score += 5
    if (user.metadata.interests.length > 0) score += 5
    
    return Math.min(score, maxScore)
  }

  /**
   * Get user profile quality score
   */
  static getProfileQualityScore(user: User): number {
    let score = 0
    
    // Base score from profile completeness
    score += this.getProfileCompleteness(user) * 0.4
    
    // Bonus for skills
    if (user.metadata.skills.length >= 3) score += 20
    
    // Bonus for interests
    if (user.metadata.interests.length >= 2) score += 15
    
    // Bonus for social links
    if (Object.keys(user.metadata.socialLinks).length >= 2) score += 15
    
    // Bonus for bio length
    if (user.bio && user.bio.length >= 50) score += 10
    
    return Math.min(score, 100)
  }
}
