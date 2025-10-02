#!/usr/bin/env node
// Payment Processing CLI
// Command-line interface for payment processing operations

import { PaymentManager, OrderManager, StripeService, RefundManager } from '../../libraries/payment-processing';
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

class PaymentProcessingCLI {
  private paymentManager: PaymentManager;
  private orderManager: OrderManager;
  // @ts-ignore - Reserved for future use
  private _stripeService: StripeService;
  private refundManager: RefundManager;
  private options: CLIOptions;

  constructor() {
    const prisma = new PrismaClient();
    const stripeConfig = {
      secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_default',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_default',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_default',
      currency: 'usd',
      applicationFeePercent: 2.9
    };

    this.paymentManager = new PaymentManager(prisma, {
      defaultCurrency: 'usd',
      supportedCurrencies: ['usd', 'eur', 'gbp', 'cad'],
      minAmount: 0.50,
      maxAmount: 999999.99,
      applicationFeePercent: 2.9,
      stripeConfig
    });
    this.orderManager = new OrderManager(prisma);
    this._stripeService = new StripeService(stripeConfig);
    this.refundManager = new RefundManager(prisma, stripeConfig.secretKey);
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
      case 'create-payment':
        return await this.createPaymentIntent(options);
      case 'confirm-payment':
        return await this.confirmPayment(options);
      case 'cancel-payment':
        return await this.cancelPayment(options);
      case 'get-payment':
        return await this.getPaymentIntent(options);
      case 'create-order':
        return await this.createOrder(options);
      case 'update-order':
        return await this.updateOrder(options);
      case 'get-order':
        return await this.getOrder(options);
      case 'cancel-order':
        return await this.cancelOrder(options);
      case 'list-orders':
        return await this.listOrders(options);
      case 'order-stats':
        return await this.getOrderStatistics(options);
      case 'create-refund':
        return await this.createRefund(options);
      case 'get-refund':
        return await this.getRefund(options);
      case 'cancel-refund':
        return await this.cancelRefund(options);
      case 'list-refunds':
        return await this.listRefunds(options);
      case 'refund-stats':
        return await this.getRefundStatistics(options);
      case 'payment-history':
        return await this.getPaymentHistory(options);
      case 'webhook':
        return await this.processWebhook(options);
      default:
        throw new Error(`Unknown command: ${action}`);
    }
  }

  private async createPaymentIntent(options: Record<string, any>): Promise<any> {
    if (!options.amount) {
      throw new Error('Amount is required for payment creation');
    }

    return await this.paymentManager.createPaymentIntent({
      amount: parseFloat(options.amount),
      currency: options.currency || 'usd',
      orderId: options.orderId,
      metadata: options.metadata ? JSON.parse(options.metadata) : {}
    });
  }

  private async confirmPayment(options: Record<string, any>): Promise<any> {
    if (!options.paymentIntentId) {
      throw new Error('Payment Intent ID is required for confirmation');
    }

    return await this.paymentManager.confirmPayment({
      paymentIntentId: options.paymentIntentId,
      clientSecret: options.clientSecret
    });
  }

  private async cancelPayment(options: Record<string, any>): Promise<any> {
    if (!options.paymentIntentId) {
      throw new Error('Payment Intent ID is required for cancellation');
    }

    return await this.paymentManager.cancelPaymentIntent(options.paymentIntentId);
  }

  private async getPaymentIntent(options: Record<string, any>): Promise<any> {
    if (!options.paymentIntentId) {
      throw new Error('Payment Intent ID is required');
    }

    return await this.paymentManager.getPaymentIntent(options.paymentIntentId);
  }

  private async createOrder(options: Record<string, any>): Promise<any> {
    const requiredFields = ['buyerId', 'sellerId', 'productId', 'amount'];
    const missingFields = requiredFields.filter(field => !(field in options));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return await this.orderManager.createOrder({
      buyerId: options.buyerId,
      sellerId: options.sellerId,
      productId: options.productId,
      amount: parseFloat(options.amount),
      currency: options.currency || 'usd'
    });
  }

  private async updateOrder(options: Record<string, any>): Promise<any> {
    if (!options.orderId) {
      throw new Error('Order ID is required for update');
    }

    const updateData: any = {};
    if (options.status) {updateData.status = options.status;}
    if (options.paymentIntentId) {updateData.paymentIntentId = options.paymentIntentId;}

    return await this.orderManager.updateOrder(options.orderId, updateData);
  }

  private async getOrder(options: Record<string, any>): Promise<any> {
    if (!options.orderId) {
      throw new Error('Order ID is required');
    }

    return await this.orderManager.getOrder(options.orderId);
  }

  private async cancelOrder(options: Record<string, any>): Promise<any> {
    if (!options.orderId || !options.userId) {
      throw new Error('Order ID and User ID are required for cancellation');
    }

    return await this.orderManager.cancelOrder(options.orderId, options.userId);
  }

  private async listOrders(options: Record<string, any>): Promise<any> {
    if (!options.userId || !options.role) {
      throw new Error('User ID and role (buyer/seller) are required');
    }

    const page = options.page ? parseInt(options.page) : 1;
    const limit = options.limit ? parseInt(options.limit) : 10;

    return await this.orderManager.getOrdersByUser(options.userId, options.role, page, limit);
  }

  private async getOrderStatistics(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    return await this.orderManager.getOrderStatistics(options.userId);
  }

  private async createRefund(options: Record<string, any>): Promise<any> {
    if (!options.paymentIntentId) {
      throw new Error('Payment Intent ID is required for refund');
    }

    const refundData: any = {
      paymentIntentId: options.paymentIntentId,
      reason: options.reason
    };
    
    if (options.amount) {
      refundData.amount = parseFloat(options.amount);
    }
    
    return await this.refundManager.createRefund(refundData);
  }

  private async getRefund(options: Record<string, any>): Promise<any> {
    if (!options.refundId) {
      throw new Error('Refund ID is required');
    }

    return await this.refundManager.getRefund(options.refundId);
  }

  private async cancelRefund(options: Record<string, any>): Promise<any> {
    if (!options.refundId) {
      throw new Error('Refund ID is required for cancellation');
    }

    return await this.refundManager.cancelRefund(options.refundId);
  }

  private async listRefunds(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    const page = options.page ? parseInt(options.page) : 1;
    const limit = options.limit ? parseInt(options.limit) : 10;

    return await this.refundManager.getRefundsByUser(options.userId, page, limit);
  }

  private async getRefundStatistics(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    return await this.refundManager.getRefundStatistics(options.userId);
  }

  private async getPaymentHistory(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    const page = options.page ? parseInt(options.page) : 1;
    const limit = options.limit ? parseInt(options.limit) : 10;

    return await this.paymentManager.getPaymentHistory(options.userId, page, limit);
  }

  private async processWebhook(options: Record<string, any>): Promise<any> {
    if (!options.event) {
      throw new Error('Event data is required for webhook processing');
    }

    const event = JSON.parse(options.event);
    return await this.paymentManager.processWebhook(event);
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
Payment Processing CLI

Usage: payment-cli [options] <command> [arguments]

Commands:
  create-payment              Create a payment intent
    --amount <number>         Payment amount
    --currency <string>       Currency (optional, default: usd)
    --orderId <string>        Order ID (optional)
    --metadata <json>         Metadata (optional)

  confirm-payment             Confirm a payment intent
    --paymentIntentId <string> Payment Intent ID
    --clientSecret <string>   Client secret (optional)

  cancel-payment              Cancel a payment intent
    --paymentIntentId <string> Payment Intent ID

  get-payment                 Get payment intent details
    --paymentIntentId <string> Payment Intent ID

  create-order                Create a new order
    --buyerId <string>        Buyer ID
    --sellerId <string>       Seller ID
    --productId <string>      Product ID
    --amount <number>         Order amount
    --currency <string>       Currency (optional, default: usd)

  update-order                Update an order
    --orderId <string>        Order ID
    --status <string>         New status (optional)
    --paymentIntentId <string> Payment Intent ID (optional)

  get-order                   Get order details
    --orderId <string>        Order ID

  cancel-order                Cancel an order
    --orderId <string>        Order ID
    --userId <string>         User ID

  list-orders                 List orders for a user
    --userId <string>         User ID
    --role <string>           Role (buyer/seller)
    --page <number>           Page number (optional)
    --limit <number>          Items per page (optional)

  order-stats                 Get order statistics
    --userId <string>         User ID

  create-refund               Create a refund
    --paymentIntentId <string> Payment Intent ID
    --amount <number>         Refund amount (optional)
    --reason <string>         Refund reason (optional)

  get-refund                  Get refund details
    --refundId <string>       Refund ID

  cancel-refund               Cancel a refund
    --refundId <string>       Refund ID

  list-refunds                List refunds for a user
    --userId <string>         User ID
    --page <number>           Page number (optional)
    --limit <number>          Items per page (optional)

  refund-stats                Get refund statistics
    --userId <string>         User ID

  payment-history             Get payment history
    --userId <string>         User ID
    --page <number>           Page number (optional)
    --limit <number>          Items per page (optional)

  webhook                     Process webhook event
    --event <json>            Event data

Options:
  --json                      Output in JSON format
  --help, -h                 Show this help message
  --version, -v              Show version information

Examples:
  payment-cli create-payment --amount 99.99 --currency usd --orderId "order123"
  payment-cli create-order --buyerId "user1" --sellerId "user2" --productId "product1" --amount 99.99
  payment-cli confirm-payment --paymentIntentId "pi_1234567890"
  payment-cli list-orders --userId "user1" --role "buyer" --page 1 --limit 10
  payment-cli create-refund --paymentIntentId "pi_1234567890" --amount 50.00 --reason "Customer request"
  payment-cli --json create-payment --amount 99.99 --currency usd
`);
  }

  private showVersion(): void {
    console.log('Payment Processing CLI v1.0.0');
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new PaymentProcessingCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export default PaymentProcessingCLI;
