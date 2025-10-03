import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserListQuerySchema,
  UserSearchSchema,
  UserProfileSchema,
  UserPreferencesSchema,
  UserMetadataSchema,
  UserService,
  UserValidator,
  UserRole,
  UserStatus,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListQuery,
  UserSearchRequest,
  UserProfile,
  UserPreferences,
  UserMetadata
} from '../../../src/lib/models/User'

describe('User Model Tests', () => {
  let validUser: User
  let validCreateUserRequest: CreateUserRequest
  let validUpdateUserRequest: UpdateUserRequest
  let validUserListQuery: UserListQuery
  let validUserSearchRequest: UserSearchRequest
  let validUserProfile: UserProfile
  let validUserPreferences: UserPreferences
  let validUserMetadata: UserMetadata

  beforeEach(() => {
    validUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      passwordHash: 'hashedpassword123',
      fullName: 'John Doe',
      profilePictureUrl: 'https://example.com/profile.jpg',
      bio: 'Software developer with 5 years of experience',
      role: 'attendee',
      status: 'active',
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        language: 'en',
        timezone: 'UTC',
        theme: 'light',
        privacyLevel: 'public'
      },
      metadata: {
        company: 'Tech Corp',
        jobTitle: 'Senior Developer',
        location: 'San Francisco, CA',
        website: 'https://johndoe.com',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe'
        },
        skills: ['JavaScript', 'TypeScript', 'React'],
        interests: ['Web Development', 'AI', 'Machine Learning'],
        customFields: {}
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    validCreateUserRequest = {
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'Jane Smith',
      profilePictureUrl: 'https://example.com/jane.jpg',
      bio: 'Product manager with 3 years of experience',
      role: 'organizer',
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: true,
        language: 'en',
        timezone: 'PST',
        theme: 'dark',
        privacyLevel: 'private'
      },
      metadata: {
        company: 'Product Inc',
        jobTitle: 'Product Manager',
        location: 'Seattle, WA',
        website: 'https://janesmith.com',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/janesmith'
        },
        skills: ['Product Management', 'Agile', 'User Research'],
        interests: ['Product Strategy', 'UX Design'],
        customFields: {}
      }
    }

    validUpdateUserRequest = {
      fullName: 'John Updated Doe',
      bio: 'Updated bio',
      preferences: {
        emailNotifications: false,
        pushNotifications: true,
        smsNotifications: false,
        language: 'es',
        timezone: 'EST',
        theme: 'dark',
        privacyLevel: 'private'
      }
    }

    validUserListQuery = {
      role: 'attendee',
      status: 'active',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      includeInactive: false
    }

    validUserSearchRequest = {
      query: 'developer',
      role: 'attendee',
      skills: ['JavaScript', 'React'],
      location: 'San Francisco',
      page: 1,
      limit: 10
    }

    validUserProfile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      fullName: 'John Doe',
      profilePictureUrl: 'https://example.com/profile.jpg',
      bio: 'Software developer with 5 years of experience',
      role: 'attendee',
      status: 'active',
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        language: 'en',
        timezone: 'UTC',
        theme: 'light',
        privacyLevel: 'public'
      },
      metadata: {
        company: 'Tech Corp',
        jobTitle: 'Senior Developer',
        location: 'San Francisco, CA',
        website: 'https://johndoe.com',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe'
        },
        skills: ['JavaScript', 'TypeScript', 'React'],
        interests: ['Web Development', 'AI', 'Machine Learning'],
        customFields: {}
      }
    }

    validUserPreferences = {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      language: 'en',
      timezone: 'UTC',
      theme: 'light',
      privacyLevel: 'public'
    }

    validUserMetadata = {
      company: 'Tech Corp',
      jobTitle: 'Senior Developer',
      location: 'San Francisco, CA',
      website: 'https://johndoe.com',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/johndoe',
        twitter: 'https://twitter.com/johndoe'
      },
      skills: ['JavaScript', 'TypeScript', 'React'],
      interests: ['Web Development', 'AI', 'Machine Learning'],
      customFields: {}
    }
  })

  describe('User Schema Validation', () => {
    it('should validate a valid user', () => {
      const result = UserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should reject user with invalid email', () => {
      const invalidUser = { ...validUser, email: 'invalid-email' }
      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['email'])
      }
    })

    it('should reject user with invalid role', () => {
      const invalidUser = { ...validUser, role: 'invalid-role' as UserRole }
      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['role'])
      }
    })

    it('should reject user with invalid status', () => {
      const invalidUser = { ...validUser, status: 'invalid-status' as UserStatus }
      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['status'])
      }
    })

    it('should reject user with invalid UUID', () => {
      const invalidUser = { ...validUser, id: 'invalid-uuid' }
      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })

    it('should reject user with empty full name', () => {
      const invalidUser = { ...validUser, fullName: '' }
      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['fullName'])
      }
    })

    it('should reject user with bio exceeding 500 characters', () => {
      const invalidUser = { ...validUser, bio: 'a'.repeat(501) }
      const result = UserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['bio'])
      }
    })
  })

  describe('Create User Schema Validation', () => {
    it('should validate a valid create user request', () => {
      const result = CreateUserSchema.safeParse(validCreateUserRequest)
      expect(result.success).toBe(true)
    })

    it('should reject create user request with invalid email', () => {
      const invalidRequest = { ...validCreateUserRequest, email: 'invalid-email' }
      const result = CreateUserSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['email'])
      }
    })

    it('should reject create user request with weak password', () => {
      const invalidRequest = { ...validCreateUserRequest, password: '123' }
      const result = CreateUserSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['password'])
      }
    })

    it('should reject create user request with empty full name', () => {
      const invalidRequest = { ...validCreateUserRequest, fullName: '' }
      const result = CreateUserSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['fullName'])
      }
    })
  })

  describe('Update User Schema Validation', () => {
    it('should validate a valid update user request', () => {
      const result = UpdateUserSchema.safeParse(validUpdateUserRequest)
      expect(result.success).toBe(true)
    })

    it('should reject update user request with invalid email', () => {
      const invalidRequest = { ...validUpdateUserRequest, email: 'invalid-email' }
      const result = UpdateUserSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['email'])
      }
    })

    it('should reject update user request with empty full name', () => {
      const invalidRequest = { ...validUpdateUserRequest, fullName: '' }
      const result = UpdateUserSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['fullName'])
      }
    })
  })

  describe('User List Query Schema Validation', () => {
    it('should validate a valid user list query', () => {
      const result = UserListQuerySchema.safeParse(validUserListQuery)
      expect(result.success).toBe(true)
    })

    it('should reject user list query with invalid page', () => {
      const invalidQuery = { ...validUserListQuery, page: 0 }
      const result = UserListQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['page'])
      }
    })

    it('should reject user list query with invalid limit', () => {
      const invalidQuery = { ...validUserListQuery, limit: 101 }
      const result = UserListQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['limit'])
      }
    })
  })

  describe('User Search Schema Validation', () => {
    it('should validate a valid user search request', () => {
      const result = UserSearchSchema.safeParse(validUserSearchRequest)
      expect(result.success).toBe(true)
    })

    it('should reject user search request with empty query', () => {
      const invalidRequest = { ...validUserSearchRequest, query: '' }
      const result = UserSearchSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['query'])
      }
    })

    it('should reject user search request with query exceeding 100 characters', () => {
      const invalidRequest = { ...validUserSearchRequest, query: 'a'.repeat(101) }
      const result = UserSearchSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['query'])
      }
    })
  })

  describe('User Profile Schema Validation', () => {
    it('should validate a valid user profile', () => {
      const result = UserProfileSchema.safeParse(validUserProfile)
      expect(result.success).toBe(true)
    })

    it('should reject user profile with invalid email', () => {
      const invalidProfile = { ...validUserProfile, email: 'invalid-email' }
      const result = UserProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['email'])
      }
    })
  })

  describe('User Preferences Schema Validation', () => {
    it('should validate valid user preferences', () => {
      const result = UserPreferencesSchema.safeParse(validUserPreferences)
      expect(result.success).toBe(true)
    })

    it('should reject user preferences with invalid language', () => {
      const invalidPreferences = { ...validUserPreferences, language: 'invalid-lang' }
      const result = UserPreferencesSchema.safeParse(invalidPreferences)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['language'])
      }
    })

    it('should reject user preferences with invalid timezone', () => {
      const invalidPreferences = { ...validUserPreferences, timezone: 'invalid-tz' }
      const result = UserPreferencesSchema.safeParse(invalidPreferences)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['timezone'])
      }
    })
  })

  describe('User Metadata Schema Validation', () => {
    it('should validate valid user metadata', () => {
      const result = UserMetadataSchema.safeParse(validUserMetadata)
      expect(result.success).toBe(true)
    })

    it('should reject user metadata with invalid website URL', () => {
      const invalidMetadata = { ...validUserMetadata, website: 'invalid-url' }
      const result = UserMetadataSchema.safeParse(invalidMetadata)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['website'])
      }
    })

    it('should reject user metadata with invalid social links', () => {
      const invalidMetadata = { 
        ...validUserMetadata, 
        socialLinks: { linkedin: 'invalid-url' }
      }
      const result = UserMetadataSchema.safeParse(invalidMetadata)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['socialLinks', 'linkedin'])
      }
    })
  })

  describe('UserValidator', () => {
    describe('validateEmail', () => {
      it('should validate a valid email', () => {
        const result = UserValidator.validateEmail('test@example.com')
        expect(result.isValid).toBe(true)
      })

      it('should reject invalid email format', () => {
        const result = UserValidator.validateEmail('invalid-email')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Invalid email format')
      })

      it('should reject empty email', () => {
        const result = UserValidator.validateEmail('')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Email is required')
      })
    })

    describe('validatePassword', () => {
      it('should validate a strong password', () => {
        const result = UserValidator.validatePassword('StrongPass123!')
        expect(result.isValid).toBe(true)
      })

      it('should reject weak password', () => {
        const result = UserValidator.validatePassword('123')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Password must be at least 8 characters')
      })

      it('should reject password without uppercase', () => {
        const result = UserValidator.validatePassword('password123!')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Password must contain at least one uppercase letter')
      })

      it('should reject password without lowercase', () => {
        const result = UserValidator.validatePassword('PASSWORD123!')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Password must contain at least one lowercase letter')
      })

      it('should reject password without number', () => {
        const result = UserValidator.validatePassword('Password!')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Password must contain at least one number')
      })

      it('should reject password without special character', () => {
        const result = UserValidator.validatePassword('Password123')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Password must contain at least one special character')
      })
    })

    describe('validateFullName', () => {
      it('should validate a valid full name', () => {
        const result = UserValidator.validateFullName('John Doe')
        expect(result.isValid).toBe(true)
      })

      it('should reject empty full name', () => {
        const result = UserValidator.validateFullName('')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Full name is required')
      })

      it('should reject full name exceeding 100 characters', () => {
        const result = UserValidator.validateFullName('a'.repeat(101))
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Full name cannot exceed 100 characters')
      })
    })

    describe('validateBio', () => {
      it('should validate a valid bio', () => {
        const result = UserValidator.validateBio('Software developer with 5 years of experience')
        expect(result.isValid).toBe(true)
      })

      it('should reject bio exceeding 500 characters', () => {
        const result = UserValidator.validateBio('a'.repeat(501))
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Bio cannot exceed 500 characters')
      })
    })

    describe('validateRole', () => {
      it('should validate a valid role', () => {
        const result = UserValidator.validateRole('attendee')
        expect(result.isValid).toBe(true)
      })

      it('should reject invalid role', () => {
        const result = UserValidator.validateRole('invalid-role' as UserRole)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Invalid user role')
      })
    })

    describe('validateStatus', () => {
      it('should validate a valid status', () => {
        const result = UserValidator.validateStatus('active')
        expect(result.isValid).toBe(true)
      })

      it('should reject invalid status', () => {
        const result = UserValidator.validateStatus('invalid-status' as UserStatus)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Invalid user status')
      })
    })

    describe('validateMetadata', () => {
      it('should validate valid metadata', () => {
        const result = UserValidator.validateMetadata(validUserMetadata)
        expect(result.isValid).toBe(true)
      })

      it('should reject metadata with too many skills', () => {
        const invalidMetadata = { 
          ...validUserMetadata, 
          skills: Array(21).fill('skill')
        }
        const result = UserValidator.validateMetadata(invalidMetadata)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Cannot have more than 20 skills')
      })

      it('should reject metadata with too many interests', () => {
        const invalidMetadata = { 
          ...validUserMetadata, 
          interests: Array(16).fill('interest')
        }
        const result = UserValidator.validateMetadata(invalidMetadata)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Cannot have more than 15 interests')
      })
    })

    describe('sanitizeInput', () => {
      it('should sanitize input text', () => {
        const result = UserValidator.sanitizeInput('<script>alert("xss")</script>Hello World')
        expect(result).toBe('Hello World')
      })

      it('should trim whitespace', () => {
        const result = UserValidator.sanitizeInput('  Hello World  ')
        expect(result).toBe('Hello World')
      })
    })
  })

  describe('UserService', () => {
    describe('isActive', () => {
      it('should return true for active user', () => {
        const result = UserService.isActive(validUser)
        expect(result).toBe(true)
      })

      it('should return false for inactive user', () => {
        const inactiveUser = { ...validUser, status: 'inactive' }
        const result = UserService.isActive(inactiveUser)
        expect(result).toBe(false)
      })
    })

    describe('isOrganizer', () => {
      it('should return true for organizer', () => {
        const organizerUser = { ...validUser, role: 'organizer' }
        const result = UserService.isOrganizer(organizerUser)
        expect(result).toBe(true)
      })

      it('should return false for attendee', () => {
        const result = UserService.isOrganizer(validUser)
        expect(result).toBe(false)
      })
    })

    describe('isAdmin', () => {
      it('should return true for admin', () => {
        const adminUser = { ...validUser, role: 'admin' }
        const result = UserService.isAdmin(adminUser)
        expect(result).toBe(true)
      })

      it('should return false for attendee', () => {
        const result = UserService.isAdmin(validUser)
        expect(result).toBe(false)
      })
    })

    describe('canCreateEvents', () => {
      it('should return true for organizer', () => {
        const organizerUser = { ...validUser, role: 'organizer' }
        const result = UserService.canCreateEvents(organizerUser)
        expect(result).toBe(true)
      })

      it('should return true for admin', () => {
        const adminUser = { ...validUser, role: 'admin' }
        const result = UserService.canCreateEvents(adminUser)
        expect(result).toBe(true)
      })

      it('should return false for attendee', () => {
        const result = UserService.canCreateEvents(validUser)
        expect(result).toBe(false)
      })
    })

    describe('canManageUsers', () => {
      it('should return true for admin', () => {
        const adminUser = { ...validUser, role: 'admin' }
        const result = UserService.canManageUsers(adminUser)
        expect(result).toBe(true)
      })

      it('should return false for organizer', () => {
        const organizerUser = { ...validUser, role: 'organizer' }
        const result = UserService.canManageUsers(organizerUser)
        expect(result).toBe(false)
      })

      it('should return false for attendee', () => {
        const result = UserService.canManageUsers(validUser)
        expect(result).toBe(false)
      })
    })

    describe('hasEmailNotifications', () => {
      it('should return true when email notifications enabled', () => {
        const result = UserService.hasEmailNotifications(validUser)
        expect(result).toBe(true)
      })

      it('should return false when email notifications disabled', () => {
        const userWithoutEmail = { 
          ...validUser, 
          preferences: { ...validUser.preferences, emailNotifications: false }
        }
        const result = UserService.hasEmailNotifications(userWithoutEmail)
        expect(result).toBe(false)
      })
    })

    describe('hasPushNotifications', () => {
      it('should return true when push notifications enabled', () => {
        const result = UserService.hasPushNotifications(validUser)
        expect(result).toBe(true)
      })

      it('should return false when push notifications disabled', () => {
        const userWithoutPush = { 
          ...validUser, 
          preferences: { ...validUser.preferences, pushNotifications: false }
        }
        const result = UserService.hasPushNotifications(userWithoutPush)
        expect(result).toBe(false)
      })
    })

    describe('hasSmsNotifications', () => {
      it('should return true when SMS notifications enabled', () => {
        const userWithSms = { 
          ...validUser, 
          preferences: { ...validUser.preferences, smsNotifications: true }
        }
        const result = UserService.hasSmsNotifications(userWithSms)
        expect(result).toBe(true)
      })

      it('should return false when SMS notifications disabled', () => {
        const result = UserService.hasSmsNotifications(validUser)
        expect(result).toBe(false)
      })
    })

    describe('getDisplayName', () => {
      it('should return full name when available', () => {
        const result = UserService.getDisplayName(validUser)
        expect(result).toBe('John Doe')
      })

      it('should return email when full name not available', () => {
        const userWithoutName = { ...validUser, fullName: '' }
        const result = UserService.getDisplayName(userWithoutName)
        expect(result).toBe('test@example.com')
      })
    })

    describe('getProfilePictureUrl', () => {
      it('should return profile picture URL when available', () => {
        const result = UserService.getProfilePictureUrl(validUser)
        expect(result).toBe('https://example.com/profile.jpg')
      })

      it('should return default URL when profile picture not available', () => {
        const userWithoutPicture = { ...validUser, profilePictureUrl: undefined }
        const result = UserService.getProfilePictureUrl(userWithoutPicture)
        expect(result).toBe('/default-avatar.png')
      })
    })

    describe('getBio', () => {
      it('should return bio when available', () => {
        const result = UserService.getBio(validUser)
        expect(result).toBe('Software developer with 5 years of experience')
      })

      it('should return empty string when bio not available', () => {
        const userWithoutBio = { ...validUser, bio: undefined }
        const result = UserService.getBio(userWithoutBio)
        expect(result).toBe('')
      })
    })

    describe('getCompany', () => {
      it('should return company when available', () => {
        const result = UserService.getCompany(validUser)
        expect(result).toBe('Tech Corp')
      })

      it('should return empty string when company not available', () => {
        const userWithoutCompany = { 
          ...validUser, 
          metadata: { ...validUser.metadata, company: undefined }
        }
        const result = UserService.getCompany(userWithoutCompany)
        expect(result).toBe('')
      })
    })

    describe('getJobTitle', () => {
      it('should return job title when available', () => {
        const result = UserService.getJobTitle(validUser)
        expect(result).toBe('Senior Developer')
      })

      it('should return empty string when job title not available', () => {
        const userWithoutJobTitle = { 
          ...validUser, 
          metadata: { ...validUser.metadata, jobTitle: undefined }
        }
        const result = UserService.getJobTitle(userWithoutJobTitle)
        expect(result).toBe('')
      })
    })

    describe('getLocation', () => {
      it('should return location when available', () => {
        const result = UserService.getLocation(validUser)
        expect(result).toBe('San Francisco, CA')
      })

      it('should return empty string when location not available', () => {
        const userWithoutLocation = { 
          ...validUser, 
          metadata: { ...validUser.metadata, location: undefined }
        }
        const result = UserService.getLocation(userWithoutLocation)
        expect(result).toBe('')
      })
    })

    describe('getWebsite', () => {
      it('should return website when available', () => {
        const result = UserService.getWebsite(validUser)
        expect(result).toBe('https://johndoe.com')
      })

      it('should return empty string when website not available', () => {
        const userWithoutWebsite = { 
          ...validUser, 
          metadata: { ...validUser.metadata, website: undefined }
        }
        const result = UserService.getWebsite(userWithoutWebsite)
        expect(result).toBe('')
      })
    })

    describe('getSocialLinks', () => {
      it('should return social links when available', () => {
        const result = UserService.getSocialLinks(validUser)
        expect(result).toEqual({
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe'
        })
      })

      it('should return empty object when social links not available', () => {
        const userWithoutSocialLinks = { 
          ...validUser, 
          metadata: { ...validUser.metadata, socialLinks: {} }
        }
        const result = UserService.getSocialLinks(userWithoutSocialLinks)
        expect(result).toEqual({})
      })
    })

    describe('getSkills', () => {
      it('should return skills when available', () => {
        const result = UserService.getSkills(validUser)
        expect(result).toEqual(['JavaScript', 'TypeScript', 'React'])
      })

      it('should return empty array when skills not available', () => {
        const userWithoutSkills = { 
          ...validUser, 
          metadata: { ...validUser.metadata, skills: [] }
        }
        const result = UserService.getSkills(userWithoutSkills)
        expect(result).toEqual([])
      })
    })

    describe('getInterests', () => {
      it('should return interests when available', () => {
        const result = UserService.getInterests(validUser)
        expect(result).toEqual(['Web Development', 'AI', 'Machine Learning'])
      })

      it('should return empty array when interests not available', () => {
        const userWithoutInterests = { 
          ...validUser, 
          metadata: { ...validUser.metadata, interests: [] }
        }
        const result = UserService.getInterests(userWithoutInterests)
        expect(result).toEqual([])
      })
    })

    describe('getAgeDays', () => {
      it('should return age in days', () => {
        const result = UserService.getAgeDays(validUser)
        expect(result).toBeGreaterThan(0)
      })
    })

    describe('isNewUser', () => {
      it('should return true for new user', () => {
        const newUser = { 
          ...validUser, 
          createdAt: new Date().toISOString()
        }
        const result = UserService.isNewUser(newUser)
        expect(result).toBe(true)
      })

      it('should return false for old user', () => {
        const result = UserService.isNewUser(validUser)
        expect(result).toBe(false)
      })
    })

    describe('getRoleDisplayText', () => {
      it('should return correct display text for attendee', () => {
        const result = UserService.getRoleDisplayText(validUser)
        expect(result).toBe('Attendee')
      })

      it('should return correct display text for organizer', () => {
        const organizerUser = { ...validUser, role: 'organizer' }
        const result = UserService.getRoleDisplayText(organizerUser)
        expect(result).toBe('Organizer')
      })

      it('should return correct display text for admin', () => {
        const adminUser = { ...validUser, role: 'admin' }
        const result = UserService.getRoleDisplayText(adminUser)
        expect(result).toBe('Admin')
      })
    })

    describe('getStatusDisplayText', () => {
      it('should return correct display text for active', () => {
        const result = UserService.getStatusDisplayText(validUser)
        expect(result).toBe('Active')
      })

      it('should return correct display text for inactive', () => {
        const inactiveUser = { ...validUser, status: 'inactive' }
        const result = UserService.getStatusDisplayText(inactiveUser)
        expect(result).toBe('Inactive')
      })

      it('should return correct display text for suspended', () => {
        const suspendedUser = { ...validUser, status: 'suspended' }
        const result = UserService.getStatusDisplayText(suspendedUser)
        expect(result).toBe('Suspended')
      })
    })

    describe('getPrivacyLevel', () => {
      it('should return correct privacy level', () => {
        const result = UserService.getPrivacyLevel(validUser)
        expect(result).toBe('public')
      })
    })

    describe('getLanguage', () => {
      it('should return correct language', () => {
        const result = UserService.getLanguage(validUser)
        expect(result).toBe('en')
      })
    })

    describe('getTimezone', () => {
      it('should return correct timezone', () => {
        const result = UserService.getTimezone(validUser)
        expect(result).toBe('UTC')
      })
    })

    describe('getTheme', () => {
      it('should return correct theme', () => {
        const result = UserService.getTheme(validUser)
        expect(result).toBe('light')
      })
    })

    describe('hasSkill', () => {
      it('should return true when user has skill', () => {
        const result = UserService.hasSkill(validUser, 'JavaScript')
        expect(result).toBe(true)
      })

      it('should return false when user does not have skill', () => {
        const result = UserService.hasSkill(validUser, 'Python')
        expect(result).toBe(false)
      })
    })

    describe('hasInterest', () => {
      it('should return true when user has interest', () => {
        const result = UserService.hasInterest(validUser, 'Web Development')
        expect(result).toBe(true)
      })

      it('should return false when user does not have interest', () => {
        const result = UserService.hasInterest(validUser, 'Mobile Development')
        expect(result).toBe(false)
      })
    })

    describe('getSkillCount', () => {
      it('should return correct skill count', () => {
        const result = UserService.getSkillCount(validUser)
        expect(result).toBe(3)
      })
    })

    describe('getInterestCount', () => {
      it('should return correct interest count', () => {
        const result = UserService.getInterestCount(validUser)
        expect(result).toBe(3)
      })
    })

    describe('getSocialLinkCount', () => {
      it('should return correct social link count', () => {
        const result = UserService.getSocialLinkCount(validUser)
        expect(result).toBe(2)
      })
    })

    describe('getProfileCompleteness', () => {
      it('should return profile completeness percentage', () => {
        const result = UserService.getProfileCompleteness(validUser)
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThanOrEqual(100)
      })
    })

    describe('getProfileQualityScore', () => {
      it('should return profile quality score', () => {
        const result = UserService.getProfileQualityScore(validUser)
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThanOrEqual(100)
      })
    })
  })
})
