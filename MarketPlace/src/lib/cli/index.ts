#!/usr/bin/env node
// Main CLI Entry Point
// Unified command-line interface for all marketplace libraries

import ProductManagementCLI from './product-management/cli';
import UserAuthenticationCLI from './user-authentication/cli';
import PaymentProcessingCLI from './payment-processing/cli';
import ImageHandlingCLI from './image-handling/cli';
import NotificationSystemCLI from './notification-system/cli';

interface CLIOptions {
  json: boolean;
  help: boolean;
  version: boolean;
  library?: string;
}

interface CLICommand {
  library: string;
  action: string;
  options: Record<string, any>;
}

class MarketplaceCLI {
  private options: CLIOptions;

  constructor() {
    this.options = this.parseOptions();
  }

  async run(): Promise<void> {
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
      version: args.includes('--version') || args.includes('-v'),
      library: this.extractLibrary(args) || ''
    };
  }

  private extractLibrary(args: string[]): string | undefined {
    const libraryIndex = args.findIndex(arg => arg === '--library' || arg === '-l');
    if (libraryIndex !== -1 && libraryIndex + 1 < args.length) {
      return args[libraryIndex + 1];
    }
    return undefined;
  }

  private async parseCommand(): Promise<CLICommand> {
    const args = process.argv.slice(2).filter(arg => 
      !arg.startsWith('--') && arg !== '--library' && arg !== '-l'
    );
    
    if (args.length === 0) {
      throw new Error('No command specified');
    }

    let library: string;
    let action: string;
    const options: Record<string, any> = {};

    if (this.options.library) {
      library = this.options.library;
      action = args[0] || '';
      // Parse remaining arguments as key-value pairs
      for (let i = 1; i < args.length; i += 2) {
        if (i + 1 < args.length) {
          const key = args[i];
          const value = args[i + 1];
          
          // Try to parse as JSON if it looks like JSON
          try {
            if (key && value) {
              options[key] = JSON.parse(value);
            }
          } catch {
            if (key && value) {
              options[key] = value;
            }
          }
        }
      }
    } else {
      // Auto-detect library from first argument
      library = args[0] || '';
      action = args[1] || 'help';
      
      // Parse remaining arguments as key-value pairs
      for (let i = 2; i < args.length; i += 2) {
        if (i + 1 < args.length) {
          const key = args[i];
          const value = args[i + 1];
          
          // Try to parse as JSON if it looks like JSON
          try {
            if (key && value) {
              options[key] = JSON.parse(value);
            }
          } catch {
            if (key && value) {
              options[key] = value;
            }
          }
        }
      }
    }

    return { library, action, options };
  }

  private async executeCommand(command: CLICommand): Promise<any> {
    const { library } = command;

    // Add json option to all commands
    if (this.options.json) {
      // JSON output is handled by individual CLI classes
    }

    switch (library.toLowerCase()) {
      case 'product':
      case 'product-management': {
        const productCLI = new ProductManagementCLI();
        return await productCLI.run();
      }
      
      case 'user':
      case 'user-authentication': {
        const userCLI = new UserAuthenticationCLI();
        return await userCLI.run();
      }
      
      case 'payment':
      case 'payment-processing': {
        const paymentCLI = new PaymentProcessingCLI();
        return await paymentCLI.run();
      }
      
      case 'image':
      case 'image-handling': {
        const imageCLI = new ImageHandlingCLI();
        return await imageCLI.run();
      }
      
      case 'notification':
      case 'notification-system': {
        const notificationCLI = new NotificationSystemCLI();
        return await notificationCLI.run();
      }
      
      default:
        throw new Error(`Unknown library: ${library}. Available libraries: product, user, payment, image, notification`);
    }
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
Marketplace CLI

A unified command-line interface for all marketplace libraries.

Usage: marketplace-cli [options] <library> <command> [arguments]
   or: marketplace-cli [options] --library <library> <command> [arguments]

Libraries:
  product, product-management     Product Management operations
  user, user-authentication       User Authentication operations
  payment, payment-processing    Payment Processing operations
  image, image-handling          Image Handling operations
  notification, notification-system  Notification System operations

Options:
  --library, -l <library>        Specify the library to use
  --json                          Output in JSON format
  --help, -h                     Show this help message
  --version, -v                  Show version information

Examples:
  marketplace-cli product create --title "iPhone 15" --description "Latest iPhone" --price 999.99 --sellerId "user123"
  marketplace-cli user register --username "john_doe" --email "john@example.com" --password "secure123"
  marketplace-cli payment create-intent --amount 999.99 --currency "usd" --orderId "order123"
  marketplace-cli image upload --file "/path/to/image.jpg" --filename "product.jpg" --uploadedBy "user123"
  marketplace-cli notification create --userId "user123" --type "PURCHASE_CONFIRMATION" --title "Purchase Confirmed" --message "Your order has been confirmed"
  
  marketplace-cli --library product create --title "iPhone 15" --description "Latest iPhone" --price 999.99 --sellerId "user123"
  marketplace-cli --json product create --title "iPhone 15" --description "Latest iPhone" --price 999.99 --sellerId "user123"

Library-specific help:
  marketplace-cli product help
  marketplace-cli user help
  marketplace-cli payment help
  marketplace-cli image help
  marketplace-cli notification help
`);
  }

  private showVersion(): void {
    console.log('Marketplace CLI v1.0.0');
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new MarketplaceCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export default MarketplaceCLI;
