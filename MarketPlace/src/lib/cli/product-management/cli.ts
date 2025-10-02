#!/usr/bin/env node
// Product Management CLI
// Command-line interface for product management operations

import { ProductManager, ProductSearchEngine, ProductValidator, ProductAnalyticsEngine } from '../../libraries/product-management';
import { PrismaClient } from '@prisma/client';

interface CLIOptions {
  json: boolean;
  help: boolean;
  version: boolean;
}

interface CLICommand {
  action: string;
  options: Record<string, any>;
}

class ProductManagementCLI {
  private productManager: ProductManager;
  private searchEngine: ProductSearchEngine;
  private validator: ProductValidator;
  private analytics: ProductAnalyticsEngine;
  private options: CLIOptions;

  constructor() {
    const prisma = new PrismaClient();
    this.productManager = new ProductManager(prisma);
    this.searchEngine = new ProductSearchEngine(prisma);
    this.validator = new ProductValidator({
      maxImagesPerProduct: 10,
      maxPrice: 999999.99,
      minPrice: 0.01,
      allowedCategories: ['Electronics', 'Clothing', 'Home & Garden', 'Books', 'Sports', 'Automotive', 'Health & Beauty', 'Toys & Games'],
      imageValidation: {
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    });
    this.analytics = new ProductAnalyticsEngine(prisma);
    this.options = this.parseOptions();
  }

  public async run(): Promise<void> {
    try {
      if (this.options.help) {
        this.showHelp();
        return;
      }

      if (this.options.version) {
        this.showVersion();
        return;
      }

      const command = await this.parseCommand();
      const result = await this.executeCommand(command);
      this.outputResult(result);
    } catch (error) {
      this.outputError(error);
    }
  }

  private parseOptions(): CLIOptions {
    const args = process.argv.slice(2);
    return {
      json: args.includes('--json'),
      help: args.includes('--help') || args.includes('-h'),
      version: args.includes('--version') || args.includes('-v')
    };
  }

  private async parseCommand(): Promise<CLICommand> {
    const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
    
    if (args.length === 0) {
      throw new Error('No command specified');
    }

    const action = args[0];
    const options: Record<string, any> = {};

    // Parse remaining arguments as key-value pairs
    for (let i = 1; i < args.length; i += 2) {
      if (i + 1 < args.length) {
        const key = args[i];
        const value = args[i + 1];
        
        // Try to parse as JSON if it looks like JSON
        if (key && value) {
          try {
            options[key] = JSON.parse(value);
          } catch {
            options[key] = value;
          }
        }
      }
    }

    return { action: action || '', options };
  }

  private async executeCommand(command: CLICommand): Promise<any> {
    const { action, options } = command;

    switch (action) {
      case 'create':
        return await this.createProduct(options);
      case 'update':
        return await this.updateProduct(options);
      case 'delete':
        return await this.deleteProduct(options);
      case 'get':
        return await this.getProduct(options);
      case 'search':
        return await this.searchProducts(options);
      case 'list':
        return await this.listProducts(options);
      case 'categories':
        return await this.getCategories();
      case 'analytics':
        return await this.getAnalytics(options);
      case 'validate':
        return await this.validateProduct(options);
      default:
        throw new Error(`Unknown command: ${action}`);
    }
  }

  private async createProduct(options: Record<string, any>): Promise<any> {
    const requiredFields = ['title', 'description', 'price', 'images', 'category', 'sellerId'];
    const missingFields = requiredFields.filter(field => !(field in options));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return await this.productManager.createProduct({
      title: options.title,
      description: options.description,
      price: parseFloat(options.price),
      images: Array.isArray(options.images) ? options.images : [options.images],
      category: options.category,
      sellerId: options.sellerId
    });
  }

  private async updateProduct(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Product ID is required for update');
    }

    const updateData: any = {};
    if (options.title) {updateData.title = options.title;}
    if (options.description) {updateData.description = options.description;}
    if (options.price) {updateData.price = parseFloat(options.price);}
    if (options.images) {updateData.images = Array.isArray(options.images) ? options.images : [options.images];}
    if (options.category) {updateData.category = options.category;}
    if (options.isAvailable !== undefined) {updateData.isAvailable = options.isAvailable === 'true';}

    return await this.productManager.updateProduct(options.id, updateData);
  }

  private async deleteProduct(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Product ID is required for deletion');
    }

    return await this.productManager.deleteProduct(options.id);
  }

  private async getProduct(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Product ID is required');
    }

    return await this.productManager.getProduct(options.id);
  }

  private async searchProducts(options: Record<string, any>): Promise<any> {
    const searchOptions: any = {};
    if (options.query) {searchOptions.query = options.query;}
    if (options.category) {searchOptions.category = options.category;}
    if (options.minPrice) {searchOptions.minPrice = parseFloat(options.minPrice);}
    if (options.maxPrice) {searchOptions.maxPrice = parseFloat(options.maxPrice);}
    if (options.sellerId) {searchOptions.sellerId = options.sellerId;}
    if (options.page) {searchOptions.page = parseInt(options.page);}
    if (options.limit) {searchOptions.limit = parseInt(options.limit);}
    if (options.sortBy) {searchOptions.sortBy = options.sortBy;}
    if (options.sortOrder) {searchOptions.sortOrder = options.sortOrder;}

    return await this.searchEngine.searchProducts(searchOptions);
  }

  private async listProducts(options: Record<string, any>): Promise<any> {
    if (!options.sellerId) {
      throw new Error('Seller ID is required for listing products');
    }

    const page = options.page ? parseInt(options.page) : 1;
    const limit = options.limit ? parseInt(options.limit) : 10;

    return await this.productManager.getProductsBySeller(options.sellerId, page, limit);
  }

  private async getCategories(): Promise<any> {
    return await this.productManager.getAvailableCategories();
  }

  private async getAnalytics(options: Record<string, any>): Promise<any> {
    if (options.category) {
      return await this.analytics.getCategoryAnalytics(options.category);
    } else if (options.sellerId) {
      return await this.analytics.getSellerAnalytics(options.sellerId);
    } else {
      return await this.analytics.getOverallAnalytics();
    }
  }

  private async validateProduct(options: Record<string, any>): Promise<any> {
    const validation = this.validator.validateCreateRequest({
      title: options.title || '',
      description: options.description || '',
      price: parseFloat(options.price || '0'),
      images: Array.isArray(options.images) ? options.images : [options.images || ''],
      category: options.category || '',
      sellerId: options.sellerId || ''
    });

    return {
      success: validation.isValid,
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  private outputResult(result: any): void {
    if (this.options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.success) {
        console.log('✅ Success:', result.message || 'Operation completed successfully');
        if (result.data) {
          console.log('Data:', JSON.stringify(result.data, null, 2));
        }
      } else {
        console.error('❌ Error:', result.error || 'Operation failed');
        if (result.message) {
          console.error('Message:', result.message);
        }
      }
    }
  }

  private outputError(error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (this.options.json) {
      console.error(JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      console.error('❌ Error:', errorMessage);
    }
    
    process.exit(1);
  }

  private showHelp(): void {
    console.log(`
Product Management CLI

Usage: product-cli [options] <command> [arguments]

Commands:
  create                    Create a new product
    --title <string>        Product title
    --description <string>  Product description
    --price <number>        Product price
    --images <array>        Product images (JSON array)
    --category <string>     Product category
    --sellerId <string>     Seller ID

  update                    Update an existing product
    --id <string>           Product ID
    --title <string>        New title (optional)
    --description <string> New description (optional)
    --price <number>        New price (optional)
    --images <array>        New images (optional)
    --category <string>     New category (optional)
    --isAvailable <boolean> Availability status (optional)

  delete                    Delete a product
    --id <string>           Product ID

  get                       Get a product by ID
    --id <string>           Product ID

  search                    Search products
    --query <string>        Search query (optional)
    --category <string>     Category filter (optional)
    --minPrice <number>     Minimum price (optional)
    --maxPrice <number>     Maximum price (optional)
    --sellerId <string>     Seller filter (optional)
    --page <number>         Page number (optional)
    --limit <number>        Items per page (optional)
    --sortBy <string>       Sort field (optional)
    --sortOrder <string>    Sort direction (optional)

  list                      List products by seller
    --sellerId <string>     Seller ID
    --page <number>         Page number (optional)
    --limit <number>        Items per page (optional)

  categories                Get available categories

  analytics                 Get analytics
    --category <string>     Category analytics (optional)
    --sellerId <string>     Seller analytics (optional)

  validate                  Validate product data
    --title <string>        Product title
    --description <string>  Product description
    --price <number>        Product price
    --images <array>        Product images
    --category <string>     Product category
    --sellerId <string>     Seller ID

Options:
  --json                    Output in JSON format
  --help, -h               Show this help message
  --version, -v            Show version information

Examples:
  product-cli create --title "iPhone 15" --description "Latest iPhone" --price 999.99 --images '["image1.jpg"]' --category "Electronics" --sellerId "user123"
  product-cli search --query "iPhone" --category "Electronics" --minPrice 500 --maxPrice 1500
  product-cli analytics --category "Electronics"
  product-cli --json create --title "Test Product" --description "Test" --price 100 --images '["test.jpg"]' --category "Electronics" --sellerId "user123"
`);
  }

  private showVersion(): void {
    console.log('Product Management CLI v1.0.0');
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new ProductManagementCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export default ProductManagementCLI;
