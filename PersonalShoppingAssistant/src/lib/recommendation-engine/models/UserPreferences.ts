/**
 * User Preferences Model - User preference profile with validation
 * TASK-007: Create Data Models - FR-001
 * 
 * This model represents user shopping preferences including categories,
 * price ranges, brands, and style preferences.
 */

export interface UserPreferences {
  id: number;
  userId: number;
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  brands: string[];
  stylePreferences: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferencesCreateData {
  userId: number;
  categories: string[];
  priceRange: { min: number; max: number };
  brands: string[];
  stylePreferences: string[];
}

export interface UserPreferencesUpdateData {
  categories?: string[];
  priceRange?: { min: number; max: number };
  brands?: string[];
  stylePreferences?: string[];
}

export class UserPreferencesModel {
  private _id: number;
  private _userId: number;
  private _categories: string[];
  private _priceRange: { min: number; max: number };
  private _brands: string[];
  private _stylePreferences: string[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(data: UserPreferences) {
    this._id = data.id;
    this._userId = data.userId;
    this._categories = data.categories;
    this._priceRange = data.priceRange;
    this._brands = data.brands;
    this._stylePreferences = data.stylePreferences;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get categories(): string[] {
    return [...this._categories];
  }

  get priceRange(): { min: number; max: number } {
    return { ...this._priceRange };
  }

  get brands(): string[] {
    return [...this._brands];
  }

  get stylePreferences(): string[] {
    return [...this._stylePreferences];
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business logic methods

  /**
   * Check if user has specific category preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  hasCategory(category: string): boolean {
    return this._categories.some(cat => cat.toLowerCase() === category.toLowerCase());
  }

  /**
   * Add category preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  addCategory(category: string): boolean {
    if (this._categories.length >= 20) {
      return false; // Maximum categories reached
    }
    
    if (!this._categories.includes(category)) {
      this._categories.push(category);
      this._updatedAt = new Date();
      return true;
    }
    
    return false; // Already exists
  }

  /**
   * Remove category preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  removeCategory(category: string): boolean {
    const index = this._categories.indexOf(category);
    if (index > -1) {
      this._categories.splice(index, 1);
      this._updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Check if user has specific brand preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  hasBrand(brand: string): boolean {
    return this._brands.some(b => b.toLowerCase() === brand.toLowerCase());
  }

  /**
   * Add brand preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  addBrand(brand: string): boolean {
    if (this._brands.length >= 20) {
      return false; // Maximum brands reached
    }
    
    if (!this._brands.includes(brand)) {
      this._brands.push(brand);
      this._updatedAt = new Date();
      return true;
    }
    
    return false; // Already exists
  }

  /**
   * Remove brand preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  removeBrand(brand: string): boolean {
    const index = this._brands.indexOf(brand);
    if (index > -1) {
      this._brands.splice(index, 1);
      this._updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Check if price is within preferred range
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  isPriceInRange(price: number): boolean {
    return price >= this._priceRange.min && price <= this._priceRange.max;
  }

  /**
   * Update price range
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  updatePriceRange(min: number, max: number): boolean {
    if (min < 0 || max < min) {
      return false; // Invalid range
    }
    
    this._priceRange = { min, max };
    this._updatedAt = new Date();
    return true;
  }

  /**
   * Check if user has specific style preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  hasStylePreference(style: string): boolean {
    return this._stylePreferences.includes(style);
  }

  /**
   * Add style preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  addStylePreference(style: string): boolean {
    if (this._stylePreferences.length >= 10) {
      return false; // Maximum style preferences reached
    }
    
    if (!this._stylePreferences.includes(style)) {
      this._stylePreferences.push(style);
      this._updatedAt = new Date();
      return true;
    }
    
    return false; // Already exists
  }

  /**
   * Remove style preference
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  removeStylePreference(style: string): boolean {
    const index = this._stylePreferences.indexOf(style);
    if (index > -1) {
      this._stylePreferences.splice(index, 1);
      this._updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get preference match score for a product
   * FR-002: System MUST implement a recommendation algorithm that suggests products based on user preferences
   */
  getMatchScore(product: {
    category: string;
    brand: string;
    price: number;
    style?: string;
  }): number {
    let score = 0;
    let factors = 0;

    // Category match (40% weight)
    if (this.hasCategory(product.category)) {
      score += 0.4;
    }
    factors += 0.4;

    // Brand match (30% weight)
    if (this.hasBrand(product.brand)) {
      score += 0.3;
    }
    factors += 0.3;

    // Price range match (20% weight)
    if (this.isPriceInRange(product.price)) {
      score += 0.2;
    }
    factors += 0.2;

    // Style match (10% weight)
    if (product.style && this.hasStylePreference(product.style)) {
      score += 0.1;
    }
    if (product.style) {
      factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Get preference summary
   */
  getSummary(): {
    categoryCount: number;
    brandCount: number;
    styleCount: number;
    priceRange: { min: number; max: number };
    isEmpty: boolean;
  } {
    return {
      categoryCount: this._categories.length,
      brandCount: this._brands.length,
      styleCount: this._stylePreferences.length,
      priceRange: { ...this._priceRange },
      isEmpty: this._categories.length === 0 && 
               this._brands.length === 0 && 
               this._stylePreferences.length === 0
    };
  }

  /**
   * Update preferences from update data
   * FR-001: System MUST allow users to create and manage personal preference profiles
   */
  updateFromData(data: UserPreferencesUpdateData): boolean {
    let updated = false;

    if (data.categories !== undefined) {
      this._categories = [...data.categories];
      updated = true;
    }

    if (data.brands !== undefined) {
      this._brands = [...data.brands];
      updated = true;
    }

    if (data.stylePreferences !== undefined) {
      this._stylePreferences = [...data.stylePreferences];
      updated = true;
    }

    if (data.priceRange !== undefined) {
      this._priceRange = { ...data.priceRange };
      updated = true;
    }

    if (updated) {
      this._updatedAt = new Date();
    }

    return updated;
  }

  /**
   * Convert to plain object
   */
  toJSON(): UserPreferences {
    return {
      id: this._id,
      userId: this._userId,
      categories: [...this._categories],
      priceRange: { ...this._priceRange },
      brands: [...this._brands],
      stylePreferences: [...this._stylePreferences],
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * Create from create data
   */
  static fromCreateData(data: UserPreferencesCreateData, id: number): UserPreferencesModel {
    const now = new Date();
    return new UserPreferencesModel({
      id,
      userId: data.userId,
      categories: [...data.categories],
      priceRange: { ...data.priceRange },
      brands: [...data.brands],
      stylePreferences: [...data.stylePreferences],
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Validate preferences data
   */
  static validate(data: Partial<UserPreferences>): string[] {
    const errors: string[] = [];

    if (data.categories) {
      if (data.categories.length > 20) {
        errors.push('Too many categories (maximum 20)');
      }
      if (data.categories.some(cat => typeof cat !== 'string' || cat.trim().length === 0)) {
        errors.push('Categories must be non-empty strings');
      }
    }

    if (data.brands) {
      if (data.brands.length > 20) {
        errors.push('Too many brands (maximum 20)');
      }
      if (data.brands.some(brand => typeof brand !== 'string' || brand.trim().length === 0)) {
        errors.push('Brands must be non-empty strings');
      }
    }

    if (data.stylePreferences) {
      if (data.stylePreferences.length > 10) {
        errors.push('Too many style preferences (maximum 10)');
      }
      if (data.stylePreferences.some(style => typeof style !== 'string' || style.trim().length === 0)) {
        errors.push('Style preferences must be non-empty strings');
      }
    }

    if (data.priceRange) {
      if (data.priceRange.min < 0) {
        errors.push('Minimum price cannot be negative');
      }
      if (data.priceRange.max < data.priceRange.min) {
        errors.push('Maximum price must be greater than or equal to minimum price');
      }
      if (data.priceRange.min > 999999.99 || data.priceRange.max > 999999.99) {
        errors.push('Price values are too large');
      }
    }

    return errors;
  }

  /**
   * Get default preferences for new user
   */
  static getDefaultPreferences(userId: number): UserPreferences {
    const now = new Date();
    return {
      id: 0, // Will be set by database
      userId,
      categories: [],
      priceRange: { min: 0, max: 1000 },
      brands: [],
      stylePreferences: [],
      createdAt: now,
      updatedAt: now
    };
  }
}
