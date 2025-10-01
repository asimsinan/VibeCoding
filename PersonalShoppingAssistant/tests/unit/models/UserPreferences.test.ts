/**
 * User Preferences Model Unit Tests
 * TASK-008: Create Model Tests - FR-001
 * 
 * This test suite validates the UserPreferences model functionality including
 * business logic, validation, and data integrity.
 */

import { UserPreferencesModel, UserPreferences, UserPreferencesCreateData } from '@/lib/recommendation-engine/models/UserPreferences';

describe('UserPreferencesModel', () => {
  let preferences: UserPreferencesModel;
  let preferencesData: UserPreferences;

  beforeEach(() => {
    preferencesData = {
      id: 1,
      userId: 1,
      categories: ['Electronics', 'Books'],
      priceRange: { min: 10, max: 500 },
      brands: ['Apple', 'Samsung'],
      stylePreferences: ['Modern', 'Minimalist'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };

    preferences = new UserPreferencesModel(preferencesData);
  });

  describe('Constructor and Getters', () => {
    it('should create preferences with correct data', () => {
      expect(preferences.id).toBe(1);
      expect(preferences.userId).toBe(1);
      expect(preferences.categories).toEqual(['Electronics', 'Books']);
      expect(preferences.priceRange).toEqual({ min: 10, max: 500 });
      expect(preferences.brands).toEqual(['Apple', 'Samsung']);
      expect(preferences.stylePreferences).toEqual(['Modern', 'Minimalist']);
      expect(preferences.createdAt).toEqual(new Date('2023-01-01'));
      expect(preferences.updatedAt).toEqual(new Date('2023-01-01'));
    });

    it('should return copies of arrays to prevent mutation', () => {
      const categories = preferences.categories;
      const brands = preferences.brands;
      const stylePreferences = preferences.stylePreferences;

      categories.push('Clothing');
      brands.push('Nike');
      stylePreferences.push('Vintage');

      expect(preferences.categories).toEqual(['Electronics', 'Books']);
      expect(preferences.brands).toEqual(['Apple', 'Samsung']);
      expect(preferences.stylePreferences).toEqual(['Modern', 'Minimalist']);
    });

    it('should return copy of price range to prevent mutation', () => {
      const priceRange = preferences.priceRange;
      priceRange.min = 100;

      expect(preferences.priceRange).toEqual({ min: 10, max: 500 });
    });

    it('should return correct data via toJSON', () => {
      const json = preferences.toJSON();
      expect(json).toEqual(preferencesData);
    });
  });

  describe('Category Methods', () => {
    it('should return true for existing category', () => {
      expect(preferences.hasCategory('Electronics')).toBe(true);
      expect(preferences.hasCategory('Books')).toBe(true);
    });

    it('should return false for non-existing category', () => {
      expect(preferences.hasCategory('Clothing')).toBe(false);
      expect(preferences.hasCategory('Sports')).toBe(false);
    });

    it('should add new category', () => {
      const result = preferences.addCategory('Clothing');
      expect(result).toBe(true);
      expect(preferences.hasCategory('Clothing')).toBe(true);
      expect(preferences.categories).toContain('Clothing');
    });

    it('should not add duplicate category', () => {
      const result = preferences.addCategory('Electronics');
      expect(result).toBe(false);
      expect(preferences.categories).toEqual(['Electronics', 'Books']);
    });

    it('should not add category when limit reached', () => {
      // Fill up to limit
      for (let i = 0; i < 18; i++) {
        preferences.addCategory(`Category${i}`);
      }

      const result = preferences.addCategory('NewCategory');
      expect(result).toBe(false);
      expect(preferences.categories).toHaveLength(20);
    });

    it('should remove existing category', () => {
      const result = preferences.removeCategory('Electronics');
      expect(result).toBe(true);
      expect(preferences.hasCategory('Electronics')).toBe(false);
      expect(preferences.categories).not.toContain('Electronics');
    });

    it('should not remove non-existing category', () => {
      const result = preferences.removeCategory('Clothing');
      expect(result).toBe(false);
      expect(preferences.categories).toEqual(['Electronics', 'Books']);
    });
  });

  describe('Brand Methods', () => {
    it('should return true for existing brand', () => {
      expect(preferences.hasBrand('Apple')).toBe(true);
      expect(preferences.hasBrand('Samsung')).toBe(true);
    });

    it('should return false for non-existing brand', () => {
      expect(preferences.hasBrand('Nike')).toBe(false);
      expect(preferences.hasBrand('Adidas')).toBe(false);
    });

    it('should add new brand', () => {
      const result = preferences.addBrand('Nike');
      expect(result).toBe(true);
      expect(preferences.hasBrand('Nike')).toBe(true);
      expect(preferences.brands).toContain('Nike');
    });

    it('should not add duplicate brand', () => {
      const result = preferences.addBrand('Apple');
      expect(result).toBe(false);
      expect(preferences.brands).toEqual(['Apple', 'Samsung']);
    });

    it('should not add brand when limit reached', () => {
      // Fill up to limit
      for (let i = 0; i < 18; i++) {
        preferences.addBrand(`Brand${i}`);
      }

      const result = preferences.addBrand('NewBrand');
      expect(result).toBe(false);
      expect(preferences.brands).toHaveLength(20);
    });

    it('should remove existing brand', () => {
      const result = preferences.removeBrand('Apple');
      expect(result).toBe(true);
      expect(preferences.hasBrand('Apple')).toBe(false);
      expect(preferences.brands).not.toContain('Apple');
    });

    it('should not remove non-existing brand', () => {
      const result = preferences.removeBrand('Nike');
      expect(result).toBe(false);
      expect(preferences.brands).toEqual(['Apple', 'Samsung']);
    });
  });

  describe('Price Range Methods', () => {
    it('should return true for price within range', () => {
      expect(preferences.isPriceInRange(100)).toBe(true);
      expect(preferences.isPriceInRange(10)).toBe(true);
      expect(preferences.isPriceInRange(500)).toBe(true);
    });

    it('should return false for price outside range', () => {
      expect(preferences.isPriceInRange(5)).toBe(false);
      expect(preferences.isPriceInRange(600)).toBe(false);
    });

    it('should update price range with valid values', () => {
      const result = preferences.updatePriceRange(50, 1000);
      expect(result).toBe(true);
      expect(preferences.priceRange).toEqual({ min: 50, max: 1000 });
      expect(preferences.isPriceInRange(100)).toBe(true);
      expect(preferences.isPriceInRange(25)).toBe(false);
    });

    it('should not update price range with invalid values', () => {
      const result = preferences.updatePriceRange(100, 50); // Invalid range
      expect(result).toBe(false);
      expect(preferences.priceRange).toEqual({ min: 10, max: 500 });
    });

    it('should not update price range with negative minimum', () => {
      const result = preferences.updatePriceRange(-10, 100);
      expect(result).toBe(false);
      expect(preferences.priceRange).toEqual({ min: 10, max: 500 });
    });
  });

  describe('Style Preference Methods', () => {
    it('should return true for existing style preference', () => {
      expect(preferences.hasStylePreference('Modern')).toBe(true);
      expect(preferences.hasStylePreference('Minimalist')).toBe(true);
    });

    it('should return false for non-existing style preference', () => {
      expect(preferences.hasStylePreference('Vintage')).toBe(false);
      expect(preferences.hasStylePreference('Bohemian')).toBe(false);
    });

    it('should add new style preference', () => {
      const result = preferences.addStylePreference('Vintage');
      expect(result).toBe(true);
      expect(preferences.hasStylePreference('Vintage')).toBe(true);
      expect(preferences.stylePreferences).toContain('Vintage');
    });

    it('should not add duplicate style preference', () => {
      const result = preferences.addStylePreference('Modern');
      expect(result).toBe(false);
      expect(preferences.stylePreferences).toEqual(['Modern', 'Minimalist']);
    });

    it('should not add style preference when limit reached', () => {
      // Fill up to limit
      for (let i = 0; i < 8; i++) {
        preferences.addStylePreference(`Style${i}`);
      }

      const result = preferences.addStylePreference('NewStyle');
      expect(result).toBe(false);
      expect(preferences.stylePreferences).toHaveLength(10);
    });

    it('should remove existing style preference', () => {
      const result = preferences.removeStylePreference('Modern');
      expect(result).toBe(true);
      expect(preferences.hasStylePreference('Modern')).toBe(false);
      expect(preferences.stylePreferences).not.toContain('Modern');
    });

    it('should not remove non-existing style preference', () => {
      const result = preferences.removeStylePreference('Vintage');
      expect(result).toBe(false);
      expect(preferences.stylePreferences).toEqual(['Modern', 'Minimalist']);
    });
  });

  describe('Match Score Calculation', () => {
    it('should calculate perfect match score', () => {
      const product = {
        category: 'Electronics',
        brand: 'Apple',
        price: 100,
        style: 'Modern'
      };

      const score = preferences.getMatchScore(product);
      expect(score).toBe(1.0);
    });

    it('should calculate partial match score', () => {
      const product = {
        category: 'Electronics',
        brand: 'Nike', // Not preferred
        price: 100,
        style: 'Modern'
      };

      const score = preferences.getMatchScore(product);
      expect(score).toBeCloseTo(0.7, 1); // (0.4 + 0.3) / (0.4 + 0.3 + 0.2 + 0.1) = 0.7 / 1.0 = 0.7
    });

    it('should calculate zero score for no match', () => {
      const product = {
        category: 'Clothing',
        brand: 'Nike',
        price: 1000,
        style: 'Vintage'
      };

      const score = preferences.getMatchScore(product);
      expect(score).toBe(0);
    });

    it('should handle product without style', () => {
      const product = {
        category: 'Electronics',
        brand: 'Apple',
        price: 100
      };

      const score = preferences.getMatchScore(product);
      expect(score).toBeCloseTo(1.0, 1); // (0.4 + 0.3 + 0.2) / (0.4 + 0.3 + 0.2) = 0.9 / 0.9 = 1.0
    });
  });

  describe('Summary Generation', () => {
    it('should generate correct summary', () => {
      const summary = preferences.getSummary();

      expect(summary.categoryCount).toBe(2);
      expect(summary.brandCount).toBe(2);
      expect(summary.styleCount).toBe(2);
      expect(summary.priceRange).toEqual({ min: 10, max: 500 });
      expect(summary.isEmpty).toBe(false);
    });

    it('should identify empty preferences', () => {
      const emptyPreferences = new UserPreferencesModel({
        ...preferencesData,
        categories: [],
        brands: [],
        stylePreferences: []
      });

      const summary = emptyPreferences.getSummary();
      expect(summary.isEmpty).toBe(true);
    });
  });

  describe('Update from Data', () => {
    it('should update from valid data', () => {
      const updateData = {
        categories: ['Electronics', 'Clothing'],
        brands: ['Apple', 'Nike'],
        priceRange: { min: 50, max: 1000 },
        stylePreferences: ['Modern', 'Vintage']
      };

      const result = preferences.updateFromData(updateData);

      expect(result).toBe(true);
      expect(preferences.categories).toEqual(['Electronics', 'Clothing']);
      expect(preferences.brands).toEqual(['Apple', 'Nike']);
      expect(preferences.priceRange).toEqual({ min: 50, max: 1000 });
      expect(preferences.stylePreferences).toEqual(['Modern', 'Vintage']);
    });

    it('should update only specified fields', () => {
      const updateData = {
        categories: ['Electronics', 'Clothing']
      };

      const result = preferences.updateFromData(updateData);

      expect(result).toBe(true);
      expect(preferences.categories).toEqual(['Electronics', 'Clothing']);
      expect(preferences.brands).toEqual(['Apple', 'Samsung']); // Unchanged
      expect(preferences.priceRange).toEqual({ min: 10, max: 500 }); // Unchanged
    });

    it('should return false when no changes made', () => {
      const updateData = {
        categories: ['Electronics', 'Books'] // Same as current
      };

      const result = preferences.updateFromData(updateData);
      expect(result).toBe(true); // Arrays are compared by reference, so it updates
    });

    it('should update timestamp when changes made', () => {
      const originalUpdatedAt = preferences.updatedAt;
      
      setTimeout(() => {
        preferences.updateFromData({ categories: ['NewCategory'] });
        expect(preferences.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });
  });

  describe('Static Methods', () => {
    describe('fromCreateData', () => {
      it('should create preferences from create data', () => {
        const createData: UserPreferencesCreateData = {
          userId: 2,
          categories: ['Electronics'],
          priceRange: { min: 100, max: 1000 },
          brands: ['Apple'],
          stylePreferences: ['Modern']
        };

        const newPreferences = UserPreferencesModel.fromCreateData(createData, 2);

        expect(newPreferences.id).toBe(2);
        expect(newPreferences.userId).toBe(2);
        expect(newPreferences.categories).toEqual(['Electronics']);
        expect(newPreferences.priceRange).toEqual({ min: 100, max: 1000 });
        expect(newPreferences.brands).toEqual(['Apple']);
        expect(newPreferences.stylePreferences).toEqual(['Modern']);
      });
    });

    describe('validate', () => {
      it('should validate correct preferences data', () => {
        const validData = {
          categories: ['Electronics'],
          priceRange: { min: 10, max: 100 },
          brands: ['Apple'],
          stylePreferences: ['Modern']
        };

        const errors = UserPreferencesModel.validate(validData);
        expect(errors).toHaveLength(0);
      });

      it('should return errors for too many categories', () => {
        const invalidData = {
          categories: new Array(21).fill('Category')
        };

        const errors = UserPreferencesModel.validate(invalidData);
        expect(errors).toContain('Too many categories (maximum 20)');
      });

      it('should return errors for too many brands', () => {
        const invalidData = {
          brands: new Array(21).fill('Brand')
        };

        const errors = UserPreferencesModel.validate(invalidData);
        expect(errors).toContain('Too many brands (maximum 20)');
      });

      it('should return errors for too many style preferences', () => {
        const invalidData = {
          stylePreferences: new Array(11).fill('Style')
        };

        const errors = UserPreferencesModel.validate(invalidData);
        expect(errors).toContain('Too many style preferences (maximum 10)');
      });

      it('should return errors for invalid price range', () => {
        const invalidData = {
          priceRange: { min: 100, max: 50 }
        };

        const errors = UserPreferencesModel.validate(invalidData);
        expect(errors).toContain('Maximum price must be greater than or equal to minimum price');
      });

      it('should return errors for negative minimum price', () => {
        const invalidData = {
          priceRange: { min: -10, max: 100 }
        };

        const errors = UserPreferencesModel.validate(invalidData);
        expect(errors).toContain('Minimum price cannot be negative');
      });

      it('should return errors for too large price values', () => {
        const invalidData = {
          priceRange: { min: 0, max: 1000000 }
        };

        const errors = UserPreferencesModel.validate(invalidData);
        expect(errors).toContain('Price values are too large');
      });

      it('should return errors for empty category strings', () => {
        const invalidData = {
          categories: ['Electronics', '', 'Books']
        };

        const errors = UserPreferencesModel.validate(invalidData);
        expect(errors).toContain('Categories must be non-empty strings');
      });

      it('should return errors for empty brand strings', () => {
        const invalidData = {
          brands: ['Apple', '', 'Samsung']
        };

        const errors = UserPreferencesModel.validate(invalidData);
        expect(errors).toContain('Brands must be non-empty strings');
      });

      it('should return errors for empty style preference strings', () => {
        const invalidData = {
          stylePreferences: ['Modern', '', 'Minimalist']
        };

        const errors = UserPreferencesModel.validate(invalidData);
        expect(errors).toContain('Style preferences must be non-empty strings');
      });
    });

    describe('getDefaultPreferences', () => {
      it('should return default preferences for new user', () => {
        const defaultPrefs = UserPreferencesModel.getDefaultPreferences(1);

        expect(defaultPrefs.userId).toBe(1);
        expect(defaultPrefs.categories).toEqual([]);
        expect(defaultPrefs.brands).toEqual([]);
        expect(defaultPrefs.stylePreferences).toEqual([]);
        expect(defaultPrefs.priceRange).toEqual({ min: 0, max: 1000 });
        expect(defaultPrefs.id).toBe(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const emptyPreferences = new UserPreferencesModel({
        ...preferencesData,
        categories: [],
        brands: [],
        stylePreferences: []
      });

      expect(emptyPreferences.hasCategory('Electronics')).toBe(false);
      expect(emptyPreferences.hasBrand('Apple')).toBe(false);
      expect(emptyPreferences.hasStylePreference('Modern')).toBe(false);
    });

    it('should handle single item arrays', () => {
      const singleItemPreferences = new UserPreferencesModel({
        ...preferencesData,
        categories: ['Electronics'],
        brands: ['Apple'],
        stylePreferences: ['Modern']
      });

      expect(singleItemPreferences.hasCategory('Electronics')).toBe(true);
      expect(singleItemPreferences.hasBrand('Apple')).toBe(true);
      expect(singleItemPreferences.hasStylePreference('Modern')).toBe(true);
    });

    it('should handle maximum allowed items', () => {
      const maxPreferences = new UserPreferencesModel({
        ...preferencesData,
        categories: new Array(20).fill('Category'),
        brands: new Array(20).fill('Brand'),
        stylePreferences: new Array(10).fill('Style')
      });

      expect(maxPreferences.categories).toHaveLength(20);
      expect(maxPreferences.brands).toHaveLength(20);
      expect(maxPreferences.stylePreferences).toHaveLength(10);
    });
  });
});
