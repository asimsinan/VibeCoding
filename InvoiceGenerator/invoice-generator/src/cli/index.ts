#!/usr/bin/env node

/**
 * Invoice Generator CLI Interface
 * 
 * Command-line interface for the invoice generator library.
 * Supports --json mode, stdin/stdout, and error handling with stderr.
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { 
  calculateInvoiceTotals, 
  validateInvoice, 
  generateInvoiceId,
  generateInvoiceNumber,
  formatCurrency,
  type Invoice,
  type InvoiceRequest
} from '../lib/index.js';

const program = new Command();

program
  .name('invoice-cli')
  .description('Invoice Generator CLI - Generate and validate invoices from command line')
  .version('1.0.0');

// Calculate command
program
  .command('calculate')
  .description('Calculate invoice totals from input data')
  .option('-i, --input <file>', 'Input file path (JSON format)')
  .option('-o, --output <file>', 'Output file path (optional)')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      let inputData: InvoiceRequest;
      
      if (options.input) {
        // Read from file
        const fileContent = readFileSync(options.input, 'utf8');
        inputData = JSON.parse(fileContent);
      } else {
        // Read from stdin
        inputData = await readStdin<InvoiceRequest>();
      }

      // Validate input - convert InvoiceRequest to Invoice for validation
      const invoiceForValidation: Invoice = {
        id: '',
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        client: inputData.client,
        items: inputData.items.map(item => ({
          id: '',
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price,
          lineTotal: item.quantity * item.price
        })),
        subtotal: 0,
        taxRate: inputData.taxRate || 0,
        taxAmount: 0,
        total: 0,
        status: 'draft'
      };
      const validation = validateInvoice(invoiceForValidation);
      if (!validation.isValid) {
        console.error('Validation errors:');
        validation.errors.forEach(error => {
          console.error(`  - ${error}`);
        });
        process.exit(1);
      }

      // Calculate totals
      const invoice = {
        id: generateInvoiceId(),
        invoiceNumber: generateInvoiceNumber(),
        client: inputData.client,
        items: inputData.items.map(item => ({
          ...item,
          id: generateInvoiceId(),
          lineTotal: item.quantity * item.price
        })),
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        taxRate: inputData.taxRate || 0,
        date: new Date().toISOString().split('T')[0],
        status: 'draft' as const
      };

      const calculatedInvoice = {
        ...invoice,
        ...calculateInvoiceTotals(invoice.items, invoice.taxRate)
      };

      // Output result
      if (options.json) {
        const output = JSON.stringify(calculatedInvoice, null, 2);
        if (options.output) {
          writeFileSync(options.output, output);
          console.log(`Invoice calculated and saved to ${options.output}`);
        } else {
          console.log(output);
        }
      } else {
        // Human-readable output
        console.log('Invoice Calculation Results:');
        console.log('============================');
        console.log(`Invoice Number: ${calculatedInvoice.invoiceNumber}`);
        console.log(`Client: ${calculatedInvoice.client.name}`);
        console.log(`Date: ${calculatedInvoice.date}`);
        console.log('');
        console.log('Line Items:');
        calculatedInvoice.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.description}`);
          console.log(`     Quantity: ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.lineTotal)}`);
        });
        console.log('');
        console.log('Totals:');
        console.log(`  Subtotal: ${formatCurrency(calculatedInvoice.subtotal)}`);
        console.log(`  Tax (${calculatedInvoice.taxRate}%): ${formatCurrency(calculatedInvoice.taxAmount)}`);
        console.log(`  Total: ${formatCurrency(calculatedInvoice.total)}`);
        
        if (options.output) {
          const output = JSON.stringify(calculatedInvoice, null, 2);
          writeFileSync(options.output, output);
          console.log(`\nInvoice saved to ${options.output}`);
        }
      }
    } catch (error) {
      console.error('Error calculating invoice:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate invoice data')
  .option('-i, --input <file>', 'Input file path (JSON format)')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      let inputData: Invoice;
      
      if (options.input) {
        // Read from file
        const fileContent = readFileSync(options.input, 'utf8');
        inputData = JSON.parse(fileContent);
      } else {
        // Read from stdin
        inputData = await readStdin<Invoice>();
      }

      // Validate invoice
      const validation = validateInvoice(inputData);

      if (options.json) {
        console.log(JSON.stringify(validation, null, 2));
      } else {
        if (validation.isValid) {
          console.log('✅ Invoice is valid');
        } else {
          console.log('❌ Invoice validation failed:');
          validation.errors.forEach(error => {
            console.log(`  - ${error}`);
          });
          process.exit(1);
        }
      }
    } catch (error) {
      console.error('Error validating invoice:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Format command
program
  .command('format')
  .description('Format invoice data')
  .option('-i, --input <file>', 'Input file path (JSON format)')
  .option('-o, --output <file>', 'Output file path (optional)')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      let inputData: Invoice;
      
      if (options.input) {
        // Read from file
        const fileContent = readFileSync(options.input, 'utf8');
        inputData = JSON.parse(fileContent);
      } else {
        // Read from stdin
        inputData = await readStdin<Invoice>();
      }

      // Format invoice
      const formattedInvoice = {
        ...inputData,
        subtotal: parseFloat(inputData.subtotal.toFixed(2)),
        taxAmount: parseFloat(inputData.taxAmount.toFixed(2)),
        total: parseFloat(inputData.total.toFixed(2)),
        items: inputData.items.map(item => ({
          ...item,
          unitPrice: parseFloat(item.unitPrice.toFixed(2)),
          lineTotal: parseFloat(item.lineTotal.toFixed(2))
        }))
      };

      // Output result
      if (options.json) {
        const output = JSON.stringify(formattedInvoice, null, 2);
        if (options.output) {
          writeFileSync(options.output, output);
          console.log(`Invoice formatted and saved to ${options.output}`);
        } else {
          console.log(output);
        }
      } else {
        console.log('Invoice formatted successfully');
        if (options.output) {
          const output = JSON.stringify(formattedInvoice, null, 2);
          writeFileSync(options.output, output);
          console.log(`Formatted invoice saved to ${options.output}`);
        }
      }
    } catch (error) {
      console.error('Error formatting invoice:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate')
  .description('Generate a new invoice with sample data')
  .option('-o, --output <file>', 'Output file path (optional)')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      // Generate sample invoice
      const sampleInvoice: Invoice = {
        id: generateInvoiceId(),
        invoiceNumber: generateInvoiceNumber(),
        client: {
          name: 'Sample Client',
          address: '123 Sample Street, Sample City, SC 12345',
          email: 'client@sample.com',
          phone: '+1-555-0123'
        },
        items: [
          {
            id: generateInvoiceId(),
            description: 'Sample Service 1',
            quantity: 2,
            unitPrice: 100.00,
            lineTotal: 200.00
          },
          {
            id: generateInvoiceId(),
            description: 'Sample Service 2',
            quantity: 1,
            unitPrice: 150.00,
            lineTotal: 150.00
          }
        ],
        subtotal: 350.00,
        taxAmount: 35.00,
        total: 385.00,
        taxRate: 10,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft'
      };

      // Calculate totals
      const calculatedInvoice = {
        ...sampleInvoice,
        ...calculateInvoiceTotals(sampleInvoice.items, sampleInvoice.taxRate)
      };

      // Output result
      if (options.json) {
        const output = JSON.stringify(calculatedInvoice, null, 2);
        if (options.output) {
          writeFileSync(options.output, output);
          console.log(`Sample invoice generated and saved to ${options.output}`);
        } else {
          console.log(output);
        }
      } else {
        console.log('Sample Invoice Generated:');
        console.log('========================');
        console.log(`Invoice Number: ${calculatedInvoice.invoiceNumber}`);
        console.log(`Client: ${calculatedInvoice.client.name}`);
        console.log(`Date: ${calculatedInvoice.date}`);
        console.log(`Due Date: ${calculatedInvoice.dueDate}`);
        console.log('');
        console.log('Line Items:');
        calculatedInvoice.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.description}`);
          console.log(`     Quantity: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.lineTotal)}`);
        });
        console.log('');
        console.log('Totals:');
        console.log(`  Subtotal: ${formatCurrency(calculatedInvoice.subtotal)}`);
        console.log(`  Tax (${calculatedInvoice.taxRate}%): ${formatCurrency(calculatedInvoice.taxAmount)}`);
        console.log(`  Total: ${formatCurrency(calculatedInvoice.total)}`);
        
        if (options.output) {
          const output = JSON.stringify(calculatedInvoice, null, 2);
          writeFileSync(options.output, output);
          console.log(`\nSample invoice saved to ${options.output}`);
        }
      }
    } catch (error) {
      console.error('Error generating sample invoice:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Helper function to read from stdin
async function readStdin<T = unknown>(): Promise<T> {
  return new Promise((resolve, reject) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    let input = '';
    rl.on('line', (line) => {
      input += line + '\n';
    });

    rl.on('close', () => {
      try {
        const data = JSON.parse(input.trim());
        resolve(data as T);
      } catch {
        reject(new Error('Invalid JSON input from stdin'));
      }
    });
  });
}

// Parse command line arguments
program.parse();

// Handle unknown commands
program.on('command:*', () => {
  console.error('Invalid command: %s', program.args.join(' '));
  console.error('See --help for available commands.');
  process.exit(1);
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
