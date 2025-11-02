/**
 * Models Index
 * Exports all domain models
 */

export { User, type UserPreferences, type UserStats } from './User';
export { FoodScan, type ScanStatus, type ImageMetadata, type ScanError } from './FoodScan';
export {
  NutritionInfo,
  type Nutrients,
  type Vitamin,
  type Mineral,
} from './NutritionInfo';
export { AllergenInfo, type AllergenSeverity } from './AllergenInfo';
export {
  AlternativeSuggestion,
  type NutritionComparison,
} from './AlternativeSuggestion';

