import { ProductService } from '@/lib/services/ProductService';
import { DatabaseService } from '@/backend/src/services/DatabaseService';
import { ProductCreateData, ProductUpdateData, ProductFilter } from '@/lib/recommendation-engine/models/Product';

describe('ProductService Integration Tests', () => {
  let productService: ProductService;
  let db: DatabaseService;
  let testProductId: number;

  beforeAll(async () => {
    db = new DatabaseService();
    await db.connect();
    productService = new ProductService(db);
  });

  afterAll(async () => {
    if (testProductId) {
      await db.query('DELETE FROM products WHERE id = $1', [testProductId]);
    }
    await db.disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await db.query('DELETE FROM products WHERE name LIKE $1', ['Test%']);
  });

  describe('Product Creation', () => {
    it('should create a new product successfully', async () => {
      const productData: ProductCreateData = {
        name: 'Test Laptop',
        description: 'A high-performance laptop for testing',
        price: 999.99,
        category: 'Electronics',
        brand: 'TestBrand',
        imageUrl: 'https://example.com/laptop.jpg',
        availability: true,
        style: 'Modern'
      };

      const product = await productService.createProduct(productData);

      expect(product).toBeDefined();
      expect(product.name).toBe(productData.name);
      expect(product.description).toBe(productData.description);
      expect(product.price).toBe(productData.price);
      expect(product.category).toBe(productData.category);
      expect(product.brand).toBe(productData.brand);
      expect(product.imageUrl).toBe(productData.imageUrl);
      expect(product.availability).toBe(productData.availability);
      expect(product.style).toBe(productData.style);

      testProductId = product.id;
    });

    it('should fail to create product with duplicate name', async () => {
      const productData: ProductCreateData = {
        name: 'Test Laptop',
        description: 'Another laptop',
        price: 799.99,
        category: 'Electronics',
        brand: 'AnotherBrand'
      };

      await expect(productService.createProduct(productData)).rejects.toThrow('Product with this name already exists');
    });

    it('should fail to create product with invalid data', async () => {
      const productData: ProductCreateData = {
        name: '', // Invalid: empty name
        description: 'A product',
        price: -100, // Invalid: negative price
        category: 'Electronics',
        brand: 'TestBrand'
      };

      await expect(productService.createProduct(productData)).rejects.toThrow('Validation failed');
    });
  });

  describe('Product Retrieval', () => {
    it('should get product by ID', async () => {
      const product = await productService.getProduct(testProductId);

      expect(product).toBeDefined();
      expect(product!.id).toBe(testProductId);
      expect(product!.name).toBe('Test Laptop');
    });

    it('should return null for non-existent product', async () => {
      const product = await productService.getProduct(99999);

      expect(product).toBeNull();
    });
  });

  describe('Product Updates', () => {
    it('should update product successfully', async () => {
      const updateData: ProductUpdateData = {
        name: 'Updated Test Laptop',
        price: 899.99,
        description: 'An updated description'
      };

      const updatedProduct = await productService.updateProduct(testProductId, updateData);

      expect(updatedProduct.name).toBe(updateData.name);
      expect(updatedProduct.price).toBe(updateData.price);
      expect(updatedProduct.description).toBe(updateData.description);
      expect(updatedProduct.id).toBe(testProductId);
    });

    it('should fail to update with duplicate name', async () => {
      // Create another product
      const anotherProductData: ProductCreateData = {
        name: 'Another Test Product',
        description: 'Another product',
        price: 100,
        category: 'Electronics',
        brand: 'TestBrand'
      };

      const anotherProduct = await productService.createProduct(anotherProductData);

      const updateData: ProductUpdateData = {
        name: 'Another Test Product'
      };

      await expect(productService.updateProduct(testProductId, updateData)).rejects.toThrow('Product with this name already exists');

      // Clean up
      await productService.deleteProduct(anotherProduct.id);
    });

    it('should fail to update non-existent product', async () => {
      const updateData: ProductUpdateData = {
        name: 'Updated Name'
      };

      await expect(productService.updateProduct(99999, updateData)).rejects.toThrow('Product not found');
    });
  });

  describe('Product Search and Filtering', () => {
    beforeEach(async () => {
      // Create test products for search/filter tests
      const products: ProductCreateData[] = [
        {
          name: 'Test Smartphone',
          description: 'A modern smartphone',
          price: 699.99,
          category: 'Electronics',
          brand: 'TestBrand',
          availability: true
        },
        {
          name: 'Test Book',
          description: 'A great book to read',
          price: 19.99,
          category: 'Books',
          brand: 'TestPublisher',
          availability: true
        },
        {
          name: 'Test Shirt',
          description: 'A comfortable shirt',
          price: 29.99,
          category: 'Clothing',
          brand: 'TestFashion',
          availability: false
        }
      ];

      for (const productData of products) {
        await productService.createProduct(productData);
      }
    });

    it('should search products by query', async () => {
      const results = await productService.searchProducts('Test');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.name.includes('Test'))).toBe(true);
    });

    it('should get products by category', async () => {
      const electronics = await productService.getProductsByCategory('Electronics');

      expect(electronics.length).toBeGreaterThan(0);
      expect(electronics.every(p => p.category === 'Electronics')).toBe(true);
    });

    it('should get products by brand', async () => {
      const testBrand = await productService.getProductsByBrand('TestBrand');

      expect(testBrand.length).toBeGreaterThan(0);
      expect(testBrand.every(p => p.brand === 'TestBrand')).toBe(true);
    });

    it('should get products by price range', async () => {
      const affordable = await productService.getProductsByPriceRange(0, 50);

      expect(affordable.length).toBeGreaterThan(0);
      expect(affordable.every(p => p.price >= 0 && p.price <= 50)).toBe(true);
    });

    it('should get available products only', async () => {
      const available = await productService.getAvailableProducts();

      expect(available.length).toBeGreaterThan(0);
      expect(available.every(p => p.availability === true)).toBe(true);
    });

    it('should filter products with complex criteria', async () => {
      const filter: ProductFilter = {
        category: 'Electronics',
        minPrice: 500,
        maxPrice: 1000,
        availability: true
      };

      const results = await productService.filterProducts(filter);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(p => 
        p.category === 'Electronics' && 
        p.price >= 500 && 
        p.price <= 1000 && 
        p.availability === true
      )).toBe(true);
    });
  });

  describe('Product Statistics', () => {
    it('should get product statistics', async () => {
      const stats = await productService.getProductStats(testProductId);

      expect(stats).toBeDefined();
      expect(typeof stats.views).toBe('number');
      expect(typeof stats.likes).toBe('number');
      expect(typeof stats.purchases).toBe('number');
      expect(typeof stats.averageRating).toBe('number');
    });

    it('should get popular products', async () => {
      const popular = await productService.getPopularProducts(5);

      expect(Array.isArray(popular)).toBe(true);
      expect(popular.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Product Deletion', () => {
    it('should delete product and related data', async () => {
      const deleteResult = await productService.deleteProduct(testProductId);

      expect(deleteResult).toBe(true);

      // Verify product is deleted
      const product = await productService.getProduct(testProductId);
      expect(product).toBeNull();
    });
  });
});
