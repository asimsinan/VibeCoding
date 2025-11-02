/**
 * Allergen Business Logic Tests
 * Comprehensive tests for allergen detection, severity rules, and user matching
 * TDD RED Phase: Tests written first, expected to fail until implementation
 */

import { AllergenInfo } from '../../../src/lib/food-label-scanner/models/AllergenInfo';

describe('Allergen Business Logic', () => {
  describe('Severity Scoring', () => {
    it('should calculate severity score', () => {
      const highSeverity = new AllergenInfo('Peanuts', 'high');
      expect(highSeverity.getSeverityScore()).toBe(10);
      
      const mediumSeverity = new AllergenInfo('Soy', 'medium');
      expect(mediumSeverity.getSeverityScore()).toBe(5);
      
      const lowSeverity = new AllergenInfo('Sesame', 'low');
      expect(lowSeverity.getSeverityScore()).toBe(1);
    });

    it('should identify if allergen requires immediate warning', () => {
      const highAllergen = new AllergenInfo('Peanuts', 'high');
      expect(highAllergen.requiresImmediateWarning()).toBe(true);
      
      const mediumAllergen = new AllergenInfo('Soy', 'medium');
      expect(mediumAllergen.requiresImmediateWarning()).toBe(false);
      
      const lowAllergen = new AllergenInfo('Sesame', 'low');
      expect(lowAllergen.requiresImmediateWarning()).toBe(false);
    });
  });

  describe('User Restriction Matching', () => {
    it('should match allergen with user dietary restrictions', () => {
      const allergen = new AllergenInfo('Gluten', 'high');
      const userRestrictions = ['gluten-free', 'dairy-free'];
      
      expect(allergen.matchesUserRestriction(userRestrictions)).toBe(true);
    });

    it('should not match allergen when user has no matching restrictions', () => {
      const allergen = new AllergenInfo('Peanuts', 'high');
      const userRestrictions = ['gluten-free', 'dairy-free'];
      
      expect(allergen.matchesUserRestriction(userRestrictions)).toBe(false);
    });

    it('should match allergen with case-insensitive restriction names', () => {
      const allergen = new AllergenInfo('Dairy', 'high');
      const userRestrictions = ['GLUTEN-FREE', 'DAIRY-FREE'];
      
      expect(allergen.matchesUserRestriction(userRestrictions)).toBe(true);
    });

    it('should match allergen with partial restriction names', () => {
      const allergen = new AllergenInfo('Milk', 'high');
      const userRestrictions = ['dairy-free'];
      
      expect(allergen.matchesUserRestriction(userRestrictions)).toBe(true);
    });
  });

  describe('Allergen Comparison', () => {
    it('should compare allergen severity', () => {
      const highAllergen = new AllergenInfo('Peanuts', 'high');
      const mediumAllergen = new AllergenInfo('Soy', 'medium');
      
      expect(highAllergen.isMoreSevereThan(mediumAllergen)).toBe(true);
      expect(mediumAllergen.isMoreSevereThan(highAllergen)).toBe(false);
    });

    it('should identify common allergens', () => {
      const commonAllergens = [
        new AllergenInfo('Peanuts', 'high'),
        new AllergenInfo('Tree Nuts', 'high'),
        new AllergenInfo('Milk', 'high'),
        new AllergenInfo('Eggs', 'high'),
        new AllergenInfo('Soy', 'medium'),
      ];
      
      commonAllergens.forEach(allergen => {
        expect(allergen.isCommonAllergen()).toBe(true);
      });
    });

    it('should identify non-common allergens', () => {
      const rareAllergen = new AllergenInfo('Quinoa', 'low');
      expect(rareAllergen.isCommonAllergen()).toBe(false);
    });
  });

  describe('Allergen Grouping', () => {
    it('should identify allergen group', () => {
      const milkAllergen = new AllergenInfo('Milk', 'high');
      expect(milkAllergen.getGroup()).toBe('dairy');
      
      const peanutAllergen = new AllergenInfo('Peanuts', 'high');
      expect(peanutAllergen.getGroup()).toBe('nuts');
    });

    it('should group similar allergens together', () => {
      const allergens = [
        new AllergenInfo('Milk', 'high'),
        new AllergenInfo('Cheese', 'medium'),
        new AllergenInfo('Butter', 'low'),
      ];
      
      const groups = AllergenInfo.groupByType(allergens);
      expect(groups.dairy).toBeDefined();
      expect(groups.dairy.length).toBe(3);
    });
  });
});

