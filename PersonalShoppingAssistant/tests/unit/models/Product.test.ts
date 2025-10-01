/**
 * Product Model Unit Tests
 * TASK-008: Create Model Tests - FR-006
 * 
 * This test suite validates the Product model functionality including
 * business logic, validation, and data integrity.
 */

import { Product, ProductEntity, ProductCreateData } from '@/lib/recommendation-engine/models/Product';

describe('Product Model', () => {
  let product: Product;
  let productData: ProductEntity;

  beforeEach(() => {
    productData = {
      id: 1,
      name: 'iPhone 15 Pro',
      description: 'Latest Apple iPhone with titanium design',
      price: 999.99,
      category: 'Electronics',
      brand: 'Apple',
      imageUrl: 'https://example.com/iphone15pro.jpg',
      availability: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };

    product = new Product(productData);
  });

  describe('Constructor and Getters', () => {
    it('should create product with correct data', () => {
      expect(product.id).toBe(1);
      expect(product.name).toBe('iPhone 15 Pro');
      expect(product.description).toBe('Latest Apple iPhone with titanium design');
      expect(product.price).toBe(999.99);
      expect(product.category).toBe('Electronics');
      expect(product.brand).toBe('Apple');
      expect(product.imageUrl).toBe('https://example.com/iphone15pro.jpg');
      expect(product.availability).toBe(true);
      expect(product.createdAt).toEqual(new Date('2023-01-01'));
      expect(product.updatedAt).toEqual(new Date('2023-01-01'));
    });

    it('should return correct data via toJSON', () => {
      const json = product.toJSON();
      expect(json).toEqual(productData);
    });
  });

  describe('Filter Matching', () => {
    it('should match category filter', () => {
      const filters = { category: 'Electronics' };
      expect(product.matchesFilters(filters)).toBe(true);
    });

    it('should not match different category filter', () => {
      const filters = { category: 'Clothing' };
      expect(product.matchesFilters(filters)).toBe(false);
    });

    it('should match brand filter', () => {
      const filters = { brand: 'Apple' };
      expect(product.matchesFilters(filters)).toBe(true);
    });

    it('should not match different brand filter', () => {
      const filters = { brand: 'Samsung' };
      expect(product.matchesFilters(filters)).toBe(false);
    });

    it('should match price range filter', () => {
      const filters = { minPrice: 500, maxPrice: 1500 };
      expect(product.matchesFilters(filters)).toBe(true);
    });

    it('should not match price range filter when price too low', () => {
      const filters = { minPrice: 1000, maxPrice: 1500 };
      expect(product.matchesFilters(filters)).toBe(false);
    });

    it('should not match price range filter when price too high', () => {
      const filters = { minPrice: 500, maxPrice: 800 };
      expect(product.matchesFilters(filters)).toBe(false);
    });

    it('should match availability filter', () => {
      const filters = { availability: true };
      expect(product.matchesFilters(filters)).toBe(true);
    });

    it('should not match availability filter when unavailable', () => {
      const unavailableProduct = new Product({ ...productData, availability: false });
      const filters = { availability: true };
      expect(unavailableProduct.matchesFilters(filters)).toBe(false);
    });

    it('should match search query in name', () => {
      const filters = { searchQuery: 'iPhone' };
      expect(product.matchesFilters(filters)).toBe(true);
    });

    it('should match search query in description', () => {
      const filters = { searchQuery: 'titanium' };
      expect(product.matchesFilters(filters)).toBe(true);
    });

    it('should match search query in category', () => {
      const filters = { searchQuery: 'Electronics' };
      expect(product.matchesFilters(filters)).toBe(true);
    });

    it('should match search query in brand', () => {
      const filters = { searchQuery: 'Apple' };
      expect(product.matchesFilters(filters)).toBe(true);
    });

    it('should not match search query when not found', () => {
      const filters = { searchQuery: 'Samsung' };
      expect(product.matchesFilters(filters)).toBe(false);
    });

    it('should match multiple filters', () => {
      const filters = {
        category: 'Electronics',
        brand: 'Apple',
        minPrice: 500,
        maxPrice: 1500,
        availability: true,
        searchQuery: 'iPhone'
      };
      expect(product.matchesFilters(filters)).toBe(true);
    });

    it('should not match when any filter fails', () => {
      const filters = {
        category: 'Electronics',
        brand: 'Samsung', // This will fail
        minPrice: 500,
        maxPrice: 1500,
        availability: true,
        searchQuery: 'iPhone'
      };
      expect(product.matchesFilters(filters)).toBe(false);
    });
  });

  describe('Price Range Methods', () => {
    it('should return true for price within range', () => {
      expect(product.isInPriceRange(500, 1500)).toBe(true);
      expect(product.isInPriceRange(999.99, 1000)).toBe(true);
    });

    it('should return false for price outside range', () => {
      expect(product.isInPriceRange(500, 800)).toBe(false);
      expect(product.isInPriceRange(1200, 1500)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(product.isInPriceRange(999.99, 999.99)).toBe(true);
      expect(product.isInPriceRange(1000, 1000)).toBe(false);
    });
  });

  describe('Category Methods', () => {
    it('should return true for matching category', () => {
      expect(product.isInCategory('Electronics')).toBe(true);
    });

    it('should return false for different category', () => {
      expect(product.isInCategory('Clothing')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(product.isInCategory('electronics')).toBe(true);
      expect(product.isInCategory('ELECTRONICS')).toBe(true);
    });
  });

  describe('Brand Methods', () => {
    it('should return true for matching brand', () => {
      expect(product.isFromBrand('Apple')).toBe(true);
    });

    it('should return false for different brand', () => {
      expect(product.isFromBrand('Samsung')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(product.isFromBrand('apple')).toBe(true);
      expect(product.isFromBrand('APPLE')).toBe(true);
    });
  });

  describe('Availability Methods', () => {
    it('should return true for available product', () => {
      expect(product.isAvailable()).toBe(true);
    });

    it('should return false for unavailable product', () => {
      const unavailableProduct = new Product({ ...productData, availability: false });
      expect(unavailableProduct.isAvailable()).toBe(false);
    });
  });

  describe('Price Formatting', () => {
    it('should format price in USD by default', () => {
      const formattedPrice = product.getFormattedPrice();
      expect(formattedPrice).toBe('$999.99');
    });

    it('should format price in different currency', () => {
      const formattedPrice = product.getFormattedPrice('EUR');
      expect(formattedPrice).toMatch(/€999\.99/);
    });

    it('should handle zero price', () => {
      const freeProduct = new Product({ ...productData, price: 0 });
      const formattedPrice = freeProduct.getFormattedPrice();
      expect(formattedPrice).toBe('$0.00');
    });
  });

  describe('Summary Generation', () => {
    it('should generate correct summary', () => {
      const summary = product.getSummary();

      expect(summary.id).toBe(1);
      expect(summary.name).toBe('iPhone 15 Pro');
      expect(summary.price).toBe(999.99);
      expect(summary.category).toBe('Electronics');
      expect(summary.brand).toBe('Apple');
      expect(summary.availability).toBe(true);
      expect(summary.hasImage).toBe(true);
    });

    it('should indicate when product has no image', () => {
      const productWithoutImage = new Product({ ...productData, imageUrl: undefined });
      const summary = productWithoutImage.getSummary();
      expect(summary.hasImage).toBe(false);
    });
  });

  describe('Searchable Text', () => {
    it('should return searchable text with all fields', () => {
      const searchableText = product.getSearchableText();
      expect(searchableText).toContain('iphone 15 pro');
      expect(searchableText).toContain('latest apple iphone with titanium design');
      expect(searchableText).toContain('electronics');
      expect(searchableText).toContain('apple');
    });

    it('should handle product without description', () => {
      const productWithoutDesc = new Product({ ...productData, description: '' });
      const searchableText = productWithoutDesc.getSearchableText();
      expect(searchableText).toContain('iphone 15 pro');
      expect(searchableText).toContain('electronics');
      expect(searchableText).toContain('apple');
    });
  });

  describe('Update Methods', () => {
    it('should update name', () => {
      const result = product.updateFromData({ name: 'iPhone 15 Pro Max' });
      expect(result).toBe(true);
      expect(product.name).toBe('iPhone 15 Pro Max');
    });

    it('should update description', () => {
      const result = product.updateFromData({ description: 'Updated description' });
      expect(result).toBe(true);
      expect(product.description).toBe('Updated description');
    });

    it('should update price', () => {
      const result = product.updateFromData({ price: 1099.99 });
      expect(result).toBe(true);
      expect(product.price).toBe(1099.99);
    });

    it('should update category', () => {
      const result = product.updateFromData({ category: 'Mobile Phones' });
      expect(result).toBe(true);
      expect(product.category).toBe('Mobile Phones');
    });

    it('should update brand', () => {
      const result = product.updateFromData({ brand: 'Apple Inc.' });
      expect(result).toBe(true);
      expect(product.brand).toBe('Apple Inc.');
    });

    it('should update image URL', () => {
      const result = product.updateFromData({ imageUrl: 'https://example.com/new-image.jpg' });
      expect(result).toBe(true);
      expect(product.imageUrl).toBe('https://example.com/new-image.jpg');
    });

    it('should update availability', () => {
      const result = product.updateFromData({ availability: false });
      expect(result).toBe(true);
      expect(product.availability).toBe(false);
    });

    it('should update multiple fields', () => {
      const result = product.updateFromData({
        name: 'iPhone 15 Pro Max',
        price: 1099.99,
        availability: false
      });
      expect(result).toBe(true);
      expect(product.name).toBe('iPhone 15 Pro Max');
      expect(product.price).toBe(1099.99);
      expect(product.availability).toBe(false);
    });

    it('should return false when no changes made', () => {
      const result = product.updateFromData({ name: 'iPhone 15 Pro' });
      expect(result).toBe(false);
    });

    it('should update timestamp when changes made', () => {
      const originalUpdatedAt = product.updatedAt;
      
      setTimeout(() => {
        product.updateFromData({ name: 'New Name' });
        expect(product.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });
  });

  describe('Availability Management', () => {
    it('should set availability to true', () => {
      const unavailableProduct = new Product({ ...productData, availability: false });
      unavailableProduct.setAvailability(true);
      expect(unavailableProduct.availability).toBe(true);
    });

    it('should set availability to false', () => {
      product.setAvailability(false);
      expect(product.availability).toBe(false);
    });

    it('should not update timestamp when availability unchanged', () => {
      const originalUpdatedAt = product.updatedAt;
      product.setAvailability(true);
      expect(product.updatedAt).toEqual(originalUpdatedAt);
    });
  });

  describe('Price Updates', () => {
    it('should update price with valid value', () => {
      const result = product.updatePrice(1099.99);
      expect(result).toBe(true);
      expect(product.price).toBe(1099.99);
    });

    it('should not update price with negative value', () => {
      const result = product.updatePrice(-100);
      expect(result).toBe(false);
      expect(product.price).toBe(999.99);
    });

    it('should not update price with too large value', () => {
      const result = product.updatePrice(1000000);
      expect(result).toBe(false);
      expect(product.price).toBe(999.99);
    });

    it('should not update price when value unchanged', () => {
      const result = product.updatePrice(999.99);
      expect(result).toBe(false);
    });
  });

  describe('Static Methods', () => {
    describe('fromCreateData', () => {
      it('should create product from create data', () => {
        const createData: ProductCreateData = {
          name: 'MacBook Pro',
          description: 'Apple MacBook Pro with M3 chip',
          price: 2499.99,
          category: 'Electronics',
          brand: 'Apple',
          imageUrl: 'https://example.com/macbook.jpg',
          availability: true
        };

        const newProduct = Product.fromCreateData(createData, 2);

        expect(newProduct.id).toBe(2);
        expect(newProduct.name).toBe('MacBook Pro');
        expect(newProduct.description).toBe('Apple MacBook Pro with M3 chip');
        expect(newProduct.price).toBe(2499.99);
        expect(newProduct.category).toBe('Electronics');
        expect(newProduct.brand).toBe('Apple');
        expect(newProduct.imageUrl).toBe('https://example.com/macbook.jpg');
        expect(newProduct.availability).toBe(true);
      });

      it('should create product with default availability', () => {
        const createData: ProductCreateData = {
          name: 'MacBook Pro',
          price: 2499.99,
          category: 'Electronics',
          brand: 'Apple'
        };

        const newProduct = Product.fromCreateData(createData, 2);
        expect(newProduct.availability).toBe(true);
      });
    });

    describe('validate', () => {
      it('should validate correct product data', () => {
        const validData = {
          name: 'Test Product',
          description: 'Test description',
          price: 99.99,
          category: 'Electronics',
          brand: 'TestBrand',
          imageUrl: 'https://example.com/image.jpg',
          availability: true
        };

        const errors = Product.validate(validData);
        expect(errors).toHaveLength(0);
      });

      it('should return errors for missing name', () => {
        const invalidData = {
          name: '',
          price: 99.99,
          category: 'Electronics',
          brand: 'TestBrand'
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product name is required');
      });

      it('should return errors for name too long', () => {
        const invalidData = {
          name: 'A'.repeat(256),
          price: 99.99,
          category: 'Electronics',
          brand: 'TestBrand'
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product name is too long (maximum 255 characters)');
      });

      it('should return errors for description too long', () => {
        const invalidData = {
          name: 'Test Product',
          description: 'A'.repeat(2001),
          price: 99.99,
          category: 'Electronics',
          brand: 'TestBrand'
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product description is too long (maximum 2000 characters)');
      });

      it('should return errors for invalid price', () => {
        const invalidData = {
          name: 'Test Product',
          price: -100,
          category: 'Electronics',
          brand: 'TestBrand'
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product price cannot be negative');
      });

      it('should return errors for price too high', () => {
        const invalidData = {
          name: 'Test Product',
          price: 1000000,
          category: 'Electronics',
          brand: 'TestBrand'
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product price is too high (maximum 999,999.99)');
      });

      it('should return errors for missing category', () => {
        const invalidData = {
          name: 'Test Product',
          price: 99.99,
          category: '',
          brand: 'TestBrand'
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product category is required');
      });

      it('should return errors for category too long', () => {
        const invalidData = {
          name: 'Test Product',
          price: 99.99,
          category: 'A'.repeat(101),
          brand: 'TestBrand'
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product category is too long (maximum 100 characters)');
      });

      it('should return errors for missing brand', () => {
        const invalidData = {
          name: 'Test Product',
          price: 99.99,
          category: 'Electronics',
          brand: ''
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product brand is required');
      });

      it('should return errors for brand too long', () => {
        const invalidData = {
          name: 'Test Product',
          price: 99.99,
          category: 'Electronics',
          brand: 'A'.repeat(101)
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product brand is too long (maximum 100 characters)');
      });

      it('should return errors for invalid image URL', () => {
        const invalidData = {
          name: 'Test Product',
          price: 99.99,
          category: 'Electronics',
          brand: 'TestBrand',
          imageUrl: 'not-a-url'
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product image URL must be a valid URL');
      });

      it('should return errors for image URL too long', () => {
        const invalidData = {
          name: 'Test Product',
          price: 99.99,
          category: 'Electronics',
          brand: 'TestBrand',
          imageUrl: 'https://example.com/' + 'A'.repeat(500)
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product image URL is too long (maximum 500 characters)');
      });

      it('should return errors for invalid availability', () => {
        const invalidData = {
          name: 'Test Product',
          price: 99.99,
          category: 'Electronics',
          brand: 'TestBrand',
          availability: 'true' as any
        };

        const errors = Product.validate(invalidData);
        expect(errors).toContain('Product availability must be a boolean');
      });
    });

    describe('getCommonCategories', () => {
      it('should return array of common categories', () => {
        const categories = Product.getCommonCategories();
        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);
        expect(categories).toContain('Electronics');
        expect(categories).toContain('Clothing');
        expect(categories).toContain('Books');
      });
    });

    describe('getCommonBrands', () => {
      it('should return array of common brands', () => {
        const brands = Product.getCommonBrands();
        expect(Array.isArray(brands)).toBe(true);
        expect(brands.length).toBeGreaterThan(0);
        expect(brands).toContain('Apple');
        expect(brands).toContain('Samsung');
        expect(brands).toContain('Nike');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle product without image URL', () => {
      const productWithoutImage = new Product({ ...productData, imageUrl: undefined });
      expect(productWithoutImage.imageUrl).toBeUndefined();
      expect(productWithoutImage.getSummary().hasImage).toBe(false);
    });

    it('should handle product with empty description', () => {
      const productWithEmptyDesc = new Product({ ...productData, description: '' });
      expect(productWithEmptyDesc.description).toBe('');
      expect(productWithEmptyDesc.getSearchableText()).toContain('iphone 15 pro');
    });

    it('should handle very small price', () => {
      const cheapProduct = new Product({ ...productData, price: 0.01 });
      expect(cheapProduct.price).toBe(0.01);
      expect(cheapProduct.getFormattedPrice()).toBe('$0.01');
    });

    it('should handle very large price', () => {
      const expensiveProduct = new Product({ ...productData, price: 999999.99 });
      expect(expensiveProduct.price).toBe(999999.99);
      expect(expensiveProduct.getFormattedPrice()).toBe('$999,999.99');
    });
  });
});
