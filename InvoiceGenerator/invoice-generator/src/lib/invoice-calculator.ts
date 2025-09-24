/**
 * Invoice Calculator Library
 * 
 * Core business logic for invoice calculations including line totals,
 * subtotals, tax calculations, and final totals.
 */

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/**
 * Calculate the total for a single line item
 * @param quantity - The quantity of items
 * @param unitPrice - The price per unit
 * @returns The calculated line total
 */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

/**
 * Calculate the subtotal for all line items
 * @param lineItems - Array of line items with lineTotal property
 * @returns The calculated subtotal
 */
export function calculateSubtotal(lineItems: Array<{ lineTotal: number }>): number {
  return lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
}

/**
 * Calculate the tax amount based on subtotal and tax rate
 * @param subtotal - The subtotal amount
 * @param taxRate - The tax rate as a percentage (e.g., 10 for 10%)
 * @returns The calculated tax amount
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100);
}

/**
 * Calculate the final total including subtotal and tax
 * @param subtotal - The subtotal amount
 * @param taxAmount - The tax amount
 * @returns The calculated total
 */
export function calculateTotal(subtotal: number, taxAmount: number): number {
  return subtotal + taxAmount;
}

/**
 * Calculate all invoice totals in one operation
 * @param lineItems - Array of line items
 * @param taxRate - The tax rate as a percentage
 * @returns Object containing all calculated values
 */
export function calculateInvoiceTotals(
  lineItems: Array<{ lineTotal: number }>,
  taxRate: number = 0
): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = calculateSubtotal(lineItems);
  const taxAmount = calculateTax(subtotal, taxRate);
  const total = calculateTotal(subtotal, taxAmount);

  return {
    subtotal,
    taxAmount,
    total
  };
}

/**
 * Format a number as currency with proper precision
 * @param amount - The amount to format
 * @param currency - The currency symbol (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = '$',
  decimals: number = 2
): string {
  return `${currency}${amount.toFixed(decimals)}`;
}

/**
 * Format a number with thousand separators
 * @param amount - The amount to format
 * @param currency - The currency symbol (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string with thousand separators
 */
export function formatCurrencyWithSeparators(
  amount: number,
  currency: string = '$',
  decimals: number = 2
): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `${currency}${formatted}`;
}

/**
 * Invoice Calculator Class
 * 
 * Wrapper class for invoice calculation functions
 */
export class InvoiceCalculator {
  /**
   * Calculate invoice totals
   */
  calculateInvoice(invoiceData: any): any {
    // Calculate line totals for each item
    const itemsWithTotals = invoiceData.items.map((item: any) => ({
      ...item,
      lineTotal: calculateLineTotal(item.quantity, item.unitPrice)
    }));

    // Calculate totals
    const subtotal = calculateSubtotal(itemsWithTotals);
    const taxAmount = calculateTax(subtotal, invoiceData.taxRate || 0);
    const total = calculateTotal(subtotal, taxAmount);

    return {
      ...invoiceData,
      items: itemsWithTotals,
      subtotal,
      taxAmount,
      total
    };
  }
}
