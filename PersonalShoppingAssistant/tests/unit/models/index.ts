/**
 * Model Tests Index - Export all model test suites
 * TASK-008: Create Model Tests - FR-001 through FR-007
 * 
 * This file exports all model test suites for the Personal Shopping Assistant system
 * providing a centralized import point for all model tests.
 */

// Import all test suites to ensure they are registered
import './User.test';
import './UserPreferences.test';
import './Product.test';
import './Interaction.test';
import './Recommendation.test';

// Export test descriptions for documentation
export const modelTestSuites = [
  'User Model Tests',
  'User Preferences Model Tests', 
  'Product Model Tests',
  'Interaction Model Tests',
  'Recommendation Model Tests'
];

export const modelTestCoverage = {
  'User Model': [
    'Constructor and Getters',
    'Category Preference Methods',
    'Brand Preference Methods', 
    'Price Range Methods',
    'Style Preference Methods',
    'Preference Score Calculation',
    'Preference Updates',
    'Profile Generation',
    'Static Methods',
    'Edge Cases'
  ],
  'UserPreferences Model': [
    'Constructor and Getters',
    'Category Methods',
    'Brand Methods',
    'Price Range Methods',
    'Style Preference Methods',
    'Match Score Calculation',
    'Summary Generation',
    'Update from Data',
    'Static Methods',
    'Edge Cases'
  ],
  'Product Model': [
    'Constructor and Getters',
    'Filter Matching',
    'Price Range Methods',
    'Category Methods',
    'Brand Methods',
    'Availability Methods',
    'Price Formatting',
    'Summary Generation',
    'Searchable Text',
    'Update Methods',
    'Availability Management',
    'Price Updates',
    'Static Methods',
    'Edge Cases'
  ],
  'Interaction Model': [
    'Constructor and Getters',
    'Interaction Type Classification',
    'Weight and Score Calculation',
    'Time-based Methods',
    'Metadata Methods',
    'Update Methods',
    'Metadata Management',
    'Static Methods',
    'Edge Cases'
  ],
  'Recommendation Model': [
    'Constructor and Getters',
    'Expiration Methods',
    'Confidence Level Methods',
    'Reason Generation',
    'Quality Assessment',
    'Result Generation',
    'Update Methods',
    'Expiration Extension',
    'Age Calculation',
    'Static Methods',
    'Edge Cases'
  ]
};
