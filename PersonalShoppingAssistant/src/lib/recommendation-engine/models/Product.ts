/**
 * Product Model - Product entity with validation and business logic
 * TASK-007: Create Data Models - FR-006
 * 
 * This model represents a product in the Personal Shopping Assistant system
 * with details, pricing, availability, and business logic methods.
 */

export interface ProductEntity {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  imageUrl?: string;
  availability: boolean;
  style?: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreateData {
  name: string;
  description?: string;
  price: number;
  category: string;
  brand: string;
  imageUrl?: string;
  availability?: boolean;
  style?: string;
  rating?: number;
}

export interface ProductUpdateData {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  brand?: string;
  imageUrl?: string;
  availability?: boolean;
  style?: string;
  rating?: number;
}

export interface ProductSearchFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  availability?: boolean;
  searchQuery?: string;
}

export type ProductFilter = ProductSearchFilters & {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
};

export interface ProductSearchResult {
  products: ProductEntity[];
  totalCount: number;
  filters: ProductSearchFilters;
  searchTime: number;
}

export class Product {
  private _id: number;
  private _name: string;
  private _description: string;
  private _price: number;
  private _category: string;
  private _brand: string;
  private _imageUrl?: string;
  private _availability: boolean;
  private _style?: string;
  private _rating?: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(data: ProductEntity) {
    this._id = data.id;
    this._name = data.name;
    this._description = data.description;
    this._price = data.price;
    this._category = data.category;
    this._brand = data.brand;
    this._imageUrl = data.imageUrl;
    this._availability = data.availability;
    this._style = data.style;
    this._rating = data.rating;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get price(): number {
    return this._price;
  }

  get category(): string {
    return this._category;
  }

  get brand(): string {
    return this._brand;
  }

  get imageUrl(): string | undefined {
    return this._imageUrl;
  }

  get availability(): boolean {
    return this._availability;
  }

  get style(): string | undefined {
    return this._style;
  }

  get rating(): number | undefined {
    return this._rating;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business logic methods

  /**
   * Check if product matches search filters
   * FR-005: System MUST provide search functionality with both direct search results and personalized recommendations
   */
  matchesFilters(filters: ProductSearchFilters): boolean {
    // Category filter
    if (filters.category && this._category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }

    // Brand filter
    if (filters.brand && this._brand.toLowerCase() !== filters.brand.toLowerCase()) {
      return false;
    }

    // Price range filter
    if (filters.minPrice !== undefined && this._price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && this._price > filters.maxPrice) {
      return false;
    }

    // Availability filter
    if (filters.availability !== undefined && this._availability !== filters.availability) {
      return false;
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchText = `${this._name} ${this._description} ${this._category} ${this._brand}`.toLowerCase();
      if (!searchText.includes(query)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if product is in price range
   * FR-005: System MUST provide search functionality with both direct search results and personalized recommendations
   */
  isInPriceRange(minPrice: number, maxPrice: number): boolean {
    return this._price >= minPrice && this._price <= maxPrice;
  }

  /**
   * Check if product matches category
   * FR-005: System MUST provide search functionality with both direct search results and personalized recommendations
   */
  isInCategory(category: string): boolean {
    return this._category.toLowerCase() === category.toLowerCase();
  }

  /**
   * Check if product matches brand
   * FR-005: System MUST provide search functionality with both direct search results and personalized recommendations
   */
  isFromBrand(brand: string): boolean {
    return this._brand.toLowerCase() === brand.toLowerCase();
  }

  /**
   * Check if product is available
   * FR-006: System MUST display product information including images, descriptions, prices, and availability
   */
  isAvailable(): boolean {
    return this._availability;
  }

  /**
   * Get formatted price
   * FR-006: System MUST display product information including images, descriptions, prices, and availability
   */
  getFormattedPrice(currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(this._price);
  }

  /**
   * Get product summary
   * FR-006: System MUST display product information including images, descriptions, prices, and availability
   */
  getSummary(): {
    id: number;
    name: string;
    price: number;
    category: string;
    brand: string;
    availability: boolean;
    hasImage: boolean;
  } {
    return {
      id: this._id,
      name: this._name,
      price: this._price,
      category: this._category,
      brand: this._brand,
      availability: this._availability,
      hasImage: !!this._imageUrl
    };
  }

  /**
   * Get searchable text for full-text search
   * FR-005: System MUST provide search functionality with both direct search results and personalized recommendations
   */
  getSearchableText(): string {
    return `${this._name} ${this._description} ${this._category} ${this._brand}`.toLowerCase();
  }

  /**
   * Update product data
   * FR-006: System MUST display product information including images, descriptions, prices, and availability
   */
  updateFromData(data: ProductUpdateData): boolean {
    let updated = false;

    if (data.name !== undefined && data.name !== this._name) {
      this._name = data.name;
      updated = true;
    }

    if (data.description !== undefined && data.description !== this._description) {
      this._description = data.description;
      updated = true;
    }

    if (data.price !== undefined && data.price !== this._price) {
      this._price = data.price;
      updated = true;
    }

    if (data.category !== undefined && data.category !== this._category) {
      this._category = data.category;
      updated = true;
    }

    if (data.brand !== undefined && data.brand !== this._brand) {
      this._brand = data.brand;
      updated = true;
    }

    if (data.imageUrl !== undefined && data.imageUrl !== this._imageUrl) {
      this._imageUrl = data.imageUrl;
      updated = true;
    }

    if (data.availability !== undefined && data.availability !== this._availability) {
      this._availability = data.availability;
      updated = true;
    }

    if (updated) {
      this._updatedAt = new Date();
    }

    return updated;
  }

  /**
   * Set availability status
   * FR-006: System MUST display product information including images, descriptions, prices, and availability
   */
  setAvailability(available: boolean): void {
    if (this._availability !== available) {
      this._availability = available;
      this._updatedAt = new Date();
    }
  }

  /**
   * Update price
   * FR-006: System MUST display product information including images, descriptions, prices, and availability
   */
  updatePrice(newPrice: number): boolean {
    if (newPrice < 0 || newPrice > 999999.99) {
      return false; // Invalid price
    }

    if (this._price !== newPrice) {
      this._price = newPrice;
      this._updatedAt = new Date();
      return true;
    }

    return false; // No change
  }

  /**
   * Convert to plain object
   */
  toJSON(): ProductEntity {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      price: this._price,
      category: this._category,
      brand: this._brand,
      imageUrl: this._imageUrl,
      availability: this._availability,
      style: this._style,
      rating: this._rating,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * Create product from create data
   */
  static fromCreateData(data: ProductCreateData, id: number): Product {
    const now = new Date();
    return new Product({
      id,
      name: data.name,
      description: data.description || '',
      price: data.price,
      category: data.category,
      brand: data.brand,
      imageUrl: data.imageUrl,
      availability: data.availability !== undefined ? data.availability : true,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Validate product data
   */
  static validate(data: Partial<ProductEntity>): string[] {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Product name is required');
      } else if (data.name.length > 255) {
        errors.push('Product name is too long (maximum 255 characters)');
      }
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        errors.push('Product description must be a string');
      } else if (data.description.length > 2000) {
        errors.push('Product description is too long (maximum 2000 characters)');
      }
    }

    if (data.price !== undefined) {
      if (typeof data.price !== 'number' || isNaN(data.price)) {
        errors.push('Product price must be a valid number');
      } else if (data.price < 0) {
        errors.push('Product price cannot be negative');
      } else if (data.price > 999999.99) {
        errors.push('Product price is too high (maximum 999,999.99)');
      }
    }

    if (data.category !== undefined) {
      if (typeof data.category !== 'string' || data.category.trim().length === 0) {
        errors.push('Product category is required');
      } else if (data.category.length > 100) {
        errors.push('Product category is too long (maximum 100 characters)');
      }
    }

    if (data.brand !== undefined) {
      if (typeof data.brand !== 'string' || data.brand.trim().length === 0) {
        errors.push('Product brand is required');
      } else if (data.brand.length > 100) {
        errors.push('Product brand is too long (maximum 100 characters)');
      }
    }

    if (data.imageUrl !== undefined && data.imageUrl !== null) {
      if (typeof data.imageUrl !== 'string') {
        errors.push('Product image URL must be a string');
      } else if (data.imageUrl.length > 500) {
        errors.push('Product image URL is too long (maximum 500 characters)');
      } else if (!this.isValidUrl(data.imageUrl)) {
        errors.push('Product image URL must be a valid URL');
      }
    }

    if (data.availability !== undefined && typeof data.availability !== 'boolean') {
      errors.push('Product availability must be a boolean');
    }

    return errors;
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  /**
   * Get common product categories
   */
  static getCommonCategories(): string[] {
    return [
      'Electronics',
      'Clothing',
      'Books',
      'Home',
      'Sports',
      'Beauty',
      'Automotive',
      'Garden',
      'Toys',
      'Health',
      'Food',
      'Jewelry',
      'Shoes',
      'Bags',
      'Watches'
    ];
  }

  /**
   * Get common brands
   */
  static getCommonBrands(): string[] {
    return [
      'Apple',
      'Samsung',
      'Nike',
      'Adidas',
      'IKEA',
      'Sony',
      'Microsoft',
      'Google',
      'Amazon',
      'Zara',
      'H&M',
      'Uniqlo',
      'Levi\'s',
      'Converse',
      'Vans'
    ];
  }
}
