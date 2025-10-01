/**
 * User Preferences Component
 * TASK-021: UI-API Connection Implementation
 * 
 * Allows users to view and update their preferences for personalized recommendations.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { UserPreferences } from '../api';
import { useAuth } from '../hooks';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

export interface UserPreferencesComponentProps {
  className?: string;
  onPreferencesUpdate?: (preferences: UserPreferences) => void;
}

const PREFERENCE_CATEGORIES = [
  'electronics',
  'clothing',
  'home',
  'books',
  'sports',
  'beauty',
  'automotive',
  'food',
  'toys',
  'health',
] as const;

const PREFERENCE_BRANDS = [
  'Apple',
  'Samsung',
  'Nike',
  'Adidas',
  'Amazon',
  'Google',
  'Microsoft',
  'Sony',
  'LG',
  'Dell',
] as const;

const PRICE_RANGES = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $250', min: 100, max: 250 },
  { label: '$250 - $500', min: 250, max: 500 },
  { label: 'Over $500', min: 500, max: 10000 },
] as const;

const UserPreferencesComponent: React.FC<UserPreferencesComponentProps> = ({
  className = '',
  onPreferencesUpdate,
}) => {
  const { user, isAuthenticated, updatePreferences } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences>({
    id: 0,
    userId: 0,
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 1000 },
    stylePreferences: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Create a stable reference to user preferences
  const userPreferences = useMemo(() => {
    if (!user?.preferences) return null;
    return {
      id: user.preferences.id || 0,
      userId: user.preferences.userId || 0,
      categories: user.preferences.categories || [],
      brands: user.preferences.brands || [],
      priceRange: user.preferences.priceRange ? {
        min: Number(user.preferences.priceRange.min) || 0,
        max: Number(user.preferences.priceRange.max) || 1000
      } : { min: 0, max: 1000 },
      stylePreferences: user.preferences.stylePreferences || [],
      createdAt: user.preferences.createdAt || new Date(),
      updatedAt: user.preferences.updatedAt || new Date(),
    };
  }, [user?.preferences]);

  // Initialize preferences from user data
  useEffect(() => {
    if (userPreferences) {
      setPreferences(userPreferences);
    }
  }, [userPreferences]);


  const handleCategoryToggle = useCallback((category: string) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
    setHasChanges(true);
  }, []);

  const handleBrandToggle = useCallback((brand: string) => {
    setPreferences(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand],
    }));
    setHasChanges(true);
  }, []);

  const handleStyleToggle = useCallback((style: string) => {
    setPreferences(prev => ({
      ...prev,
      stylePreferences: prev.stylePreferences.includes(style)
        ? prev.stylePreferences.filter(s => s !== style)
        : [...prev.stylePreferences, style],
    }));
    setHasChanges(true);
  }, []);

  const handlePriceRangeChange = useCallback((min: number | undefined, max: number | undefined) => {
    setPreferences(prev => {
      // If both min and max are undefined, use default values
      // If only one is undefined, keep the existing value for that field
      const newMin = min !== undefined ? min : (prev.priceRange?.min || 0);
      const newMax = max !== undefined ? max : (prev.priceRange?.max || 1000);
      
      return {
        ...prev,
        priceRange: { min: newMin, max: newMax },
      };
    });
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setUpdating(true);
      setUpdateError(null);
      
      // Prepare preferences data, include priceRange if it's valid
      const preferencesToSend = {
        ...preferences,
        // Include priceRange if both min and max are valid numbers and min <= max
        priceRange: typeof preferences.priceRange.min === 'number' && 
                   typeof preferences.priceRange.max === 'number' &&
                   preferences.priceRange.min >= 0 && 
                   preferences.priceRange.max >= 0 &&
                   preferences.priceRange.min <= preferences.priceRange.max
          ? preferences.priceRange 
          : undefined
      };
      
      await updatePreferences(preferencesToSend);
      setHasChanges(false);
      setIsEditing(false);
      // The updatePreferences function will update the user state with the response
      // We don't need to call onPreferencesUpdate here as the user state is already updated
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      setUpdateError(error.message || 'Failed to update preferences');
    } finally {
      setUpdating(false);
    }
  }, [preferences, updatePreferences]);

  const handleCancel = useCallback(() => {
    if (user?.preferences) {
      setPreferences(user.preferences);
    }
    setHasChanges(false);
    setIsEditing(false);
  }, [user?.preferences]);

  const handleReset = useCallback(() => {
    setPreferences({
      id: 0,
      userId: 0,
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 1000 },
      stylePreferences: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setHasChanges(true);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 text-lg mb-4">
          Please sign in to view and update your preferences
        </div>
      </div>
    );
  }

  if (updateError) {
    return (
      <div className={`p-8 ${className}`}>
        <ErrorMessage 
          message={updateError} 
          onRetry={handleSave}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Preferences</h2>
          <p className="text-gray-600 mt-1">
            Customize your recommendations by setting your preferences
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updating || !hasChanges}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Preferences
            </button>
          )}
        </div>
      </div>

      {/* Preferences Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-8">
        {/* Preferred Categories */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preferred Categories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {PREFERENCE_CATEGORIES.map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(preferences.categories || []).includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  disabled={!isEditing}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preferred Brands */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preferred Brands</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {PREFERENCE_BRANDS.map((brand) => (
              <label key={brand} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(preferences.brands || []).includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                  disabled={!isEditing}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Price Range</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PRICE_RANGES.map((range) => (
                <label key={range.label} className="flex items-center">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={
                      Number(preferences.priceRange.min) === range.min &&
                      Number(preferences.priceRange.max) === range.max
                    }
                    onChange={() => handlePriceRangeChange(range.min, range.max)}
                    disabled={!isEditing}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">{range.label}</span>
                </label>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Custom Range:</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={preferences.priceRange.min || ''}
                  onChange={(e) => handlePriceRangeChange(
                    e.target.value ? Number(e.target.value) : undefined,
                    preferences.priceRange.max
                  )}
                  disabled={!isEditing}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  min="0"
                  step="0.01"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={preferences.priceRange.max || ''}
                  onChange={(e) => handlePriceRangeChange(
                    preferences.priceRange.min,
                    e.target.value ? Number(e.target.value) : undefined
                  )}
                  disabled={!isEditing}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Style Preferences */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Style Preferences</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Add a style (e.g., modern, vintage, minimalist)"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleStyleToggle(e.currentTarget.value.trim());
                  e.currentTarget.value = '';
                }
              }}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <div className="flex flex-wrap gap-2">
              {(preferences.stylePreferences || []).map((style) => (
                <span
                  key={style}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {style}
                  {isEditing && (
                    <button
                      onClick={() => handleStyleToggle(style)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Reset to Defaults
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updating || !hasChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {updateError && (
        <div className="mt-4">
          <ErrorMessage message={updateError} />
        </div>
      )}

      {/* Loading State */}
      {updating && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="small" />
        </div>
      )}
    </div>
  );
};

export default UserPreferencesComponent;
