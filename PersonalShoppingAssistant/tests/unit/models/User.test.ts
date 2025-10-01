/**
 * User Model Unit Tests
 * TASK-008: Create Model Tests - FR-007
 * 
 * This test suite validates the User model functionality including
 * business logic, validation, and data integrity.
 */

import { User, UserEntity, UserCreateData } from '@/lib/recommendation-engine/models/User';
import { UserPreferences } from '@/lib/recommendation-engine/models/UserPreferences';
import { InteractionEntity } from '@/lib/recommendation-engine/models/Interaction';

describe('User Model', () => {
  let user: User;
  let userData: UserEntity;
  let preferences: UserPreferences;

  beforeEach(() => {
    preferences = {
      id: 1,
      userId: 1,
      categories: ['Electronics', 'Books'],
      priceRange: { min: 10, max: 500 },
      brands: ['Apple', 'Samsung'],
      stylePreferences: ['Modern', 'Minimalist'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };

    userData = {
      id: 1,
      email: 'test@example.com',
      passwordHash: 'hashedpassword123',
      preferences,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };

    user = new User(userData);
  });

  describe('Constructor and Getters', () => {
    it('should create user with correct data', () => {
      expect(user.id).toBe(1);
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBe('hashedpassword123');
      expect(user.preferences).toEqual(preferences);
      expect(user.createdAt).toEqual(new Date('2023-01-01'));
      expect(user.updatedAt).toEqual(new Date('2023-01-01'));
    });

    it('should return correct user data via toJSON', () => {
      const json = user.toJSON();
      expect(json).toEqual(userData);
    });
  });

  describe('Category Preference Methods', () => {
    it('should return true for preferred category', () => {
      expect(user.hasCategoryPreference('Electronics')).toBe(true);
      expect(user.hasCategoryPreference('Books')).toBe(true);
    });

    it('should return false for non-preferred category', () => {
      expect(user.hasCategoryPreference('Clothing')).toBe(false);
      expect(user.hasCategoryPreference('Sports')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(user.hasCategoryPreference('electronics')).toBe(false);
      expect(user.hasCategoryPreference('ELECTRONICS')).toBe(false);
    });
  });

  describe('Brand Preference Methods', () => {
    it('should return true for preferred brand', () => {
      expect(user.hasBrandPreference('Apple')).toBe(true);
      expect(user.hasBrandPreference('Samsung')).toBe(true);
    });

    it('should return false for non-preferred brand', () => {
      expect(user.hasBrandPreference('Nike')).toBe(false);
      expect(user.hasBrandPreference('Adidas')).toBe(false);
    });
  });

  describe('Price Range Methods', () => {
    it('should return true for price within range', () => {
      expect(user.isPriceInRange(100)).toBe(true);
      expect(user.isPriceInRange(10)).toBe(true);
      expect(user.isPriceInRange(500)).toBe(true);
    });

    it('should return false for price outside range', () => {
      expect(user.isPriceInRange(5)).toBe(false);
      expect(user.isPriceInRange(600)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(user.isPriceInRange(0)).toBe(false);
      expect(user.isPriceInRange(-10)).toBe(false);
    });
  });

  describe('Style Preference Methods', () => {
    it('should return true for preferred style', () => {
      expect(user.hasStylePreference('Modern')).toBe(true);
      expect(user.hasStylePreference('Minimalist')).toBe(true);
    });

    it('should return false for non-preferred style', () => {
      expect(user.hasStylePreference('Vintage')).toBe(false);
      expect(user.hasStylePreference('Bohemian')).toBe(false);
    });
  });

  describe('Preference Score Calculation', () => {
    it('should calculate high score for perfect match', () => {
      const product = {
        category: 'Electronics',
        brand: 'Apple',
        price: 100,
        style: 'Modern'
      };
      
      const score = user.getPreferenceScore(product);
      expect(score).toBe(1.0);
    });

    it('should calculate partial score for partial match', () => {
      const product = {
        category: 'Electronics',
        brand: 'Nike', // Not preferred
        price: 100,
        style: 'Modern'
      };
      
      const score = user.getPreferenceScore(product);
      expect(score).toBeCloseTo(0.7, 1); // (0.4 + 0.3) / (0.4 + 0.3 + 0.2 + 0.1) = 0.7 / 1.0 = 0.7
    });

    it('should calculate zero score for no match', () => {
      const product = {
        category: 'Clothing',
        brand: 'Nike',
        price: 1000,
        style: 'Vintage'
      };
      
      const score = user.getPreferenceScore(product);
      expect(score).toBe(0);
    });

    it('should handle product without style', () => {
      const product = {
        category: 'Electronics',
        brand: 'Apple',
        price: 100
      };
      
      const score = user.getPreferenceScore(product);
      expect(score).toBeCloseTo(1.0, 1); // (0.4 + 0.3 + 0.2) / (0.4 + 0.3 + 0.2) = 0.9 / 0.9 = 1.0
    });
  });

  describe('Preference Updates', () => {
    it('should update categories', () => {
      const newCategories = ['Electronics', 'Clothing'];
      user.updatePreferences({ categories: newCategories });
      
      expect(user.preferences.categories).toEqual(newCategories);
      expect(user.hasCategoryPreference('Clothing')).toBe(true);
      expect(user.hasCategoryPreference('Books')).toBe(false);
    });

    it('should update price range', () => {
      const newPriceRange = { min: 50, max: 1000 };
      user.updatePreferences({ priceRange: newPriceRange });
      
      expect(user.preferences.priceRange).toEqual(newPriceRange);
      expect(user.isPriceInRange(100)).toBe(true);
      expect(user.isPriceInRange(25)).toBe(false);
    });

    it('should update brands', () => {
      const newBrands = ['Apple', 'Nike'];
      user.updatePreferences({ brands: newBrands });
      
      expect(user.preferences.brands).toEqual(newBrands);
      expect(user.hasBrandPreference('Nike')).toBe(true);
      expect(user.hasBrandPreference('Samsung')).toBe(false);
    });

    it('should update style preferences', () => {
      const newStyles = ['Modern', 'Vintage'];
      user.updatePreferences({ stylePreferences: newStyles });
      
      expect(user.preferences.stylePreferences).toEqual(newStyles);
      expect(user.hasStylePreference('Vintage')).toBe(true);
      expect(user.hasStylePreference('Minimalist')).toBe(false);
    });

    it('should update multiple preferences at once', () => {
      const updates = {
        categories: ['Electronics'],
        brands: ['Apple'],
        priceRange: { min: 100, max: 200 }
      };
      
      user.updatePreferences(updates);
      
      expect(user.preferences.categories).toEqual(['Electronics']);
      expect(user.preferences.brands).toEqual(['Apple']);
      expect(user.preferences.priceRange).toEqual({ min: 100, max: 200 });
    });

    it('should update updatedAt timestamp', () => {
      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        user.updatePreferences({ categories: ['NewCategory'] });
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });
  });

  describe('Profile Generation', () => {
    it('should generate profile with interaction stats', async () => {
      const interactions: InteractionEntity[] = [
        {
          id: 1,
          userId: 1,
          productId: 1,
          type: 'view',
          timestamp: new Date('2023-01-02'),
          metadata: { category: 'Electronics', brand: 'Apple' }
        },
        {
          id: 2,
          userId: 1,
          productId: 2,
          type: 'like',
          timestamp: new Date('2023-01-03'),
          metadata: { category: 'Books', brand: 'TechBooks' }
        },
        {
          id: 3,
          userId: 1,
          productId: 3,
          type: 'purchase',
          timestamp: new Date('2023-01-04'),
          metadata: { category: 'Electronics', brand: 'Samsung' }
        }
      ];

      const profile = await user.getProfile(interactions);

      expect(profile.id).toBe(1);
      expect(profile.email).toBe('test@example.com');
      expect(profile.preferences).toEqual(preferences);
      expect(profile.interactionStats.totalViews).toBe(1);
      expect(profile.interactionStats.totalLikes).toBe(1);
      expect(profile.interactionStats.totalPurchases).toBe(1);
      expect(profile.interactionStats.favoriteCategories).toContain('Electronics');
      expect(profile.interactionStats.favoriteBrands).toContain('Apple');
      expect(profile.lastActiveAt).toEqual(new Date('2023-01-04'));
    });

    it('should handle empty interactions', async () => {
      const profile = await user.getProfile([]);

      expect(profile.interactionStats.totalViews).toBe(0);
      expect(profile.interactionStats.totalLikes).toBe(0);
      expect(profile.interactionStats.totalPurchases).toBe(0);
      expect(profile.lastActiveAt).toEqual(user.createdAt);
    });
  });

  describe('Static Methods', () => {
    describe('fromCreateData', () => {
      it('should create user from create data', () => {
        const createData: UserCreateData = {
          email: 'newuser@example.com',
          password: 'password123',
          preferences: {
            categories: ['Electronics'],
            priceRange: { min: 100, max: 1000 },
            brands: ['Apple'],
            stylePreferences: ['Modern']
          }
        };

        const newUser = User.fromCreateData(createData, 2);

        expect(newUser.id).toBe(2);
        expect(newUser.email).toBe('newuser@example.com');
        expect(newUser.passwordHash).toBe(''); // Will be set by service layer
        expect(newUser.preferences.categories).toEqual(['Electronics']);
        expect(newUser.preferences.priceRange).toEqual({ min: 100, max: 1000 });
        expect(newUser.preferences.brands).toEqual(['Apple']);
        expect(newUser.preferences.stylePreferences).toEqual(['Modern']);
      });
    });

    describe('validate', () => {
      it('should validate correct user data', () => {
        const validData = {
          email: 'valid@example.com',
          preferences: {
            id: 1,
            userId: 1,
            categories: ['Electronics'],
            priceRange: { min: 10, max: 100 },
            brands: ['Apple'],
            stylePreferences: ['Modern'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const errors = User.validate(validData);
        expect(errors).toHaveLength(0);
      });

      it('should return errors for invalid email', () => {
        const invalidData = {
          email: 'invalid-email',
          preferences: {
            id: 1,
            userId: 1,
            categories: ['Electronics'],
            priceRange: { min: 10, max: 100 },
            brands: ['Apple'],
            stylePreferences: ['Modern'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const errors = User.validate(invalidData);
        expect(errors).toContain('Invalid email format');
      });

      it('should return errors for invalid price range', () => {
        const invalidData = {
          email: 'valid@example.com',
          preferences: {
            id: 1,
            userId: 1,
            categories: ['Electronics'],
            priceRange: { min: 100, max: 50 }, // Invalid range
            brands: ['Apple'],
            stylePreferences: ['Modern'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const errors = User.validate(invalidData);
        expect(errors).toContain('Maximum price must be greater than minimum price');
      });

      it('should return errors for too many categories', () => {
        const invalidData = {
          email: 'valid@example.com',
          preferences: {
            id: 1,
            userId: 1,
            categories: new Array(21).fill('Category'), // Too many
            priceRange: { min: 10, max: 100 },
            brands: ['Apple'],
            stylePreferences: ['Modern'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const errors = User.validate(invalidData);
        expect(errors).toContain('Too many categories (maximum 20)');
      });

      it('should return errors for too many brands', () => {
        const invalidData = {
          email: 'valid@example.com',
          preferences: {
            id: 1,
            userId: 1,
            categories: ['Electronics'],
            priceRange: { min: 10, max: 100 },
            brands: new Array(21).fill('Brand'), // Too many
            stylePreferences: ['Modern'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const errors = User.validate(invalidData);
        expect(errors).toContain('Too many brands (maximum 20)');
      });

      it('should return errors for too many style preferences', () => {
        const invalidData = {
          email: 'valid@example.com',
          preferences: {
            id: 1,
            userId: 1,
            categories: ['Electronics'],
            priceRange: { min: 10, max: 100 },
            brands: ['Apple'],
            stylePreferences: new Array(11).fill('Style'), // Too many
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

        const errors = User.validate(invalidData);
        expect(errors).toContain('Too many style preferences (maximum 10)');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty preferences arrays', () => {
      const emptyUser = new User({
        ...userData,
        preferences: {
          ...preferences,
          categories: [],
          brands: [],
          stylePreferences: []
        }
      });

      expect(emptyUser.hasCategoryPreference('Electronics')).toBe(false);
      expect(emptyUser.hasBrandPreference('Apple')).toBe(false);
      expect(emptyUser.hasStylePreference('Modern')).toBe(false);
    });

    it('should handle zero price range', () => {
      const zeroPriceUser = new User({
        ...userData,
        preferences: {
          ...preferences,
          priceRange: { min: 0, max: 0 }
        }
      });

      expect(zeroPriceUser.isPriceInRange(0)).toBe(true);
      expect(zeroPriceUser.isPriceInRange(1)).toBe(false);
    });

    it('should handle very large price range', () => {
      const largeRangeUser = new User({
        ...userData,
        preferences: {
          ...preferences,
          priceRange: { min: 0, max: 999999 }
        }
      });

      expect(largeRangeUser.isPriceInRange(1000000)).toBe(false);
      expect(largeRangeUser.isPriceInRange(500000)).toBe(true);
    });
  });
});
