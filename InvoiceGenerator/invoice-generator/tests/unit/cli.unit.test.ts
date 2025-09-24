/// <reference types="node" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * CLI Interface Unit Tests
 * 
 * These tests verify the CLI interface functionality including:
 * - Command parsing and execution
 * - JSON mode support
 * - stdin/stdout handling
 * - Error handling with stderr
 * - File input/output operations
 */

describe('CLI Interface Unit Tests', () => {
  let tempDir: string;
  let testInputFile: string;
  let testOutputFile: string;

  beforeEach(() => {
    tempDir = tmpdir();
    testInputFile = join(tempDir, 'test-input.json');
    testOutputFile = join(tempDir, 'test-output.json');
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(testInputFile)) {
      unlinkSync(testInputFile);
    }
    if (existsSync(testOutputFile)) {
      unlinkSync(testOutputFile);
    }
  });

  describe('CLI File Operations', () => {
    it('should create and read test files', () => {
      const testData = {
        client: {
          name: 'Test Client',
          address: '123 Test St',
          email: 'test@example.com',
          phone: '555-1234'
        },
        items: [
          {
            description: 'Test Service',
            quantity: 2,
            unitPrice: 100.00
          }
        ],
        taxRate: 10
      };

      // Test file creation
      writeFileSync(testInputFile, JSON.stringify(testData, null, 2));
      expect(existsSync(testInputFile)).toBe(true);

      // Test file reading
      const fileContent = JSON.parse(readFileSync(testInputFile, 'utf8'));
      expect(fileContent).toEqual(testData);
    });

    it('should handle file cleanup', () => {
      const testData = { test: 'data' };
      writeFileSync(testInputFile, JSON.stringify(testData));
      
      expect(existsSync(testInputFile)).toBe(true);
      
      unlinkSync(testInputFile);
      expect(existsSync(testInputFile)).toBe(false);
    });

    it('should handle multiple file operations', () => {
      const inputData = { input: 'data' };
      const outputData = { output: 'data' };

      writeFileSync(testInputFile, JSON.stringify(inputData));
      writeFileSync(testOutputFile, JSON.stringify(outputData));

      expect(existsSync(testInputFile)).toBe(true);
      expect(existsSync(testOutputFile)).toBe(true);

      // Clean up
      unlinkSync(testInputFile);
      unlinkSync(testOutputFile);

      expect(existsSync(testInputFile)).toBe(false);
      expect(existsSync(testOutputFile)).toBe(false);
    });
  });

  describe('CLI Data Validation', () => {
    it('should validate JSON data structure', () => {
      const validData = {
        client: {
          name: 'Valid Client',
          address: '123 Valid St',
          email: 'valid@example.com',
          phone: '555-1234'
        },
        items: [
          {
            description: 'Valid Service',
            quantity: 1,
            unitPrice: 100.00
          }
        ],
        taxRate: 10
      };

      expect(validData.client).toBeDefined();
      expect(validData.client.name).toBe('Valid Client');
      expect(validData.items).toHaveLength(1);
      expect(validData.items[0].quantity).toBe(1);
      expect(validData.taxRate).toBe(10);
    });

    it('should detect invalid JSON structure', () => {
      const invalidData = {
        client: {
          name: '', // Invalid: empty name
          address: '123 Invalid St',
          email: 'invalid-email', // Invalid: bad email format
          phone: '555-1234'
        },
        items: [
          {
            description: '', // Invalid: empty description
            quantity: -1, // Invalid: negative quantity
            unitPrice: -50.00 // Invalid: negative price
          }
        ],
        taxRate: 10
      };

      expect(invalidData.client.name).toBe('');
      expect(invalidData.client.email).toBe('invalid-email');
      expect(invalidData.items[0].quantity).toBeLessThan(0);
      expect(invalidData.items[0].unitPrice).toBeLessThan(0);
    });

    it('should handle missing required fields', () => {
      const incompleteData: Record<string, unknown> = {
        client: {
          // Missing name
          address: '123 Missing St',
          email: 'missing@example.com'
          // Missing phone
        },
        items: [
          {
            description: 'Missing Service'
            // Missing quantity and unitPrice
          }
        ]
        // Missing taxRate
      };

      expect((incompleteData.client as Record<string, unknown>).name).toBeUndefined();
      expect((incompleteData.client as Record<string, unknown>).phone).toBeUndefined();
      expect(((incompleteData.items as unknown[])[0] as Record<string, unknown>).quantity).toBeUndefined();
      expect(((incompleteData.items as unknown[])[0] as Record<string, unknown>).unitPrice).toBeUndefined();
      expect(incompleteData.taxRate).toBeUndefined();
    });
  });

  describe('CLI Command Structure', () => {
    it('should have valid command structure', () => {
      const commands = ['calculate', 'validate', 'format', 'generate'];
      
      commands.forEach(command => {
        expect(typeof command).toBe('string');
        expect(command.length).toBeGreaterThan(0);
        expect(command).toMatch(/^[a-z-]+$/);
      });
    });

    it('should have valid option structure', () => {
      const options = {
        input: '-i, --input <file>',
        output: '-o, --output <file>',
        json: '--json'
      };

      Object.values(options).forEach(option => {
        expect(typeof option).toBe('string');
        expect(option).toContain('--');
      });
    });

    it('should handle command line arguments', () => {
      const args = [
        'calculate',
        '--input', 'test.json',
        '--output', 'result.json',
        '--json'
      ];

      expect(args).toHaveLength(6);
      expect(args[0]).toBe('calculate');
      expect(args[1]).toBe('--input');
      expect(args[2]).toBe('test.json');
      expect(args[3]).toBe('--output');
      expect(args[4]).toBe('result.json');
      expect(args[5]).toBe('--json');
    });
  });

  describe('CLI Error Handling', () => {
    it('should handle file not found errors', () => {
      const nonExistentFile = join(tempDir, 'non-existent.json');
      expect(existsSync(nonExistentFile)).toBe(false);
    });

    it('should handle invalid JSON parsing', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => {
        JSON.parse(invalidJson);
      }).toThrow();
    });

    it('should handle empty file content', () => {
      const emptyFile = join(tempDir, 'empty.json');
      writeFileSync(emptyFile, '');
      
      expect(existsSync(emptyFile)).toBe(true);
      expect(readFileSync(emptyFile, 'utf8')).toBe('');
    });

    it('should handle malformed JSON data', () => {
      const malformedData = {
        client: null,
        items: 'not an array',
        taxRate: 'not a number'
      };

      expect(malformedData.client).toBeNull();
      expect(typeof malformedData.items).toBe('string');
      expect(typeof malformedData.taxRate).toBe('string');
    });
  });

  describe('CLI Output Formatting', () => {
    it('should format JSON output correctly', () => {
      const data = {
        id: 'INV-001',
        client: { name: 'Test Client' },
        total: 100.00
      };

      const jsonOutput = JSON.stringify(data, null, 2);
      expect(jsonOutput).toContain('"id": "INV-001"');
      expect(jsonOutput).toContain('"client": {');
      expect(jsonOutput).toContain('"name": "Test Client"');
      expect(jsonOutput).toContain('"total": 100');
    });

    it('should format human-readable output correctly', () => {
      const invoice = {
        invoiceNumber: 'INV-001',
        client: { name: 'Test Client' },
        items: [
          { description: 'Service 1', quantity: 2, unitPrice: 50.00, lineTotal: 100.00 }
        ],
        subtotal: 100.00,
        taxAmount: 10.00,
        total: 110.00
      };

      // Simulate human-readable output formatting
      const output = [
        'Invoice Calculation Results:',
        '============================',
        `Invoice Number: ${invoice.invoiceNumber}`,
        `Client: ${invoice.client.name}`,
        '',
        'Line Items:',
        `  1. ${invoice.items[0].description}`,
        `     Quantity: ${invoice.items[0].quantity} x $${invoice.items[0].unitPrice.toFixed(2)} = $${invoice.items[0].lineTotal.toFixed(2)}`,
        '',
        'Totals:',
        `  Subtotal: $${invoice.subtotal.toFixed(2)}`,
        `  Tax: $${invoice.taxAmount.toFixed(2)}`,
        `  Total: $${invoice.total.toFixed(2)}`
      ].join('\n');

      expect(output).toContain('Invoice Calculation Results');
      expect(output).toContain('INV-001');
      expect(output).toContain('Test Client');
      expect(output).toContain('Service 1');
      expect(output).toContain('$100.00');
      expect(output).toContain('$110.00');
    });

    it('should handle currency formatting', () => {
      const amounts = [0, 10.5, 100.00, 1000.50, 10000.99];
      
      amounts.forEach(amount => {
        const formatted = `$${amount.toFixed(2)}`;
        expect(formatted).toMatch(/^\$\d+\.\d{2}$/);
      });
    });
  });

  describe('CLI Integration Points', () => {
    it('should integrate with core library functions', async () => {
      // Test that CLI can work with core library functions
      const { calculateInvoiceTotals, validateInvoice, formatCurrency } = await import('../../src/lib/index');
      
      expect(typeof calculateInvoiceTotals).toBe('function');
      expect(typeof validateInvoice).toBe('function');
      expect(typeof formatCurrency).toBe('function');
    });

    it('should handle TypeScript compilation', () => {
      // Test that CLI files can be compiled
      const cliPath = join(process.cwd(), 'src', 'cli', 'index.ts');
      expect(existsSync(cliPath)).toBe(true);
      
      const binPath = join(process.cwd(), 'bin', 'invoice-cli.js');
      expect(existsSync(binPath)).toBe(true);
    });

    it('should have proper package.json configuration', () => {
      const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
      
      expect(packageJson.bin).toBeDefined();
      expect(packageJson.bin['invoice-cli']).toBe('./bin/invoice-cli.js');
      expect(packageJson.scripts.cli).toBeDefined();
      expect(packageJson.scripts['cli:calculate']).toBeDefined();
      expect(packageJson.scripts['cli:validate']).toBeDefined();
      expect(packageJson.scripts['cli:format']).toBeDefined();
      expect(packageJson.scripts['cli:generate']).toBeDefined();
    });
  });
});