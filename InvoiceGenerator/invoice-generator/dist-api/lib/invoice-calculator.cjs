"use strict";
/**
 * Invoice Calculator Library
 *
 * Core business logic for invoice calculations including line totals,
 * subtotals, tax calculations, and final totals.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceCalculator = void 0;
exports.calculateLineTotal = calculateLineTotal;
exports.calculateSubtotal = calculateSubtotal;
exports.calculateTax = calculateTax;
exports.calculateTotal = calculateTotal;
exports.calculateInvoiceTotals = calculateInvoiceTotals;
exports.formatCurrency = formatCurrency;
exports.formatCurrencyWithSeparators = formatCurrencyWithSeparators;
/**
 * Calculate the total for a single line item
 * @param quantity - The quantity of items
 * @param unitPrice - The price per unit
 * @returns The calculated line total
 */
function calculateLineTotal(quantity, unitPrice) {
    return quantity * unitPrice;
}
/**
 * Calculate the subtotal for all line items
 * @param lineItems - Array of line items with lineTotal property
 * @returns The calculated subtotal
 */
function calculateSubtotal(lineItems) {
    return lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
}
/**
 * Calculate the tax amount based on subtotal and tax rate
 * @param subtotal - The subtotal amount
 * @param taxRate - The tax rate as a percentage (e.g., 10 for 10%)
 * @returns The calculated tax amount
 */
function calculateTax(subtotal, taxRate) {
    return subtotal * (taxRate / 100);
}
/**
 * Calculate the final total including subtotal and tax
 * @param subtotal - The subtotal amount
 * @param taxAmount - The tax amount
 * @returns The calculated total
 */
function calculateTotal(subtotal, taxAmount) {
    return subtotal + taxAmount;
}
/**
 * Calculate all invoice totals in one operation
 * @param lineItems - Array of line items
 * @param taxRate - The tax rate as a percentage
 * @returns Object containing all calculated values
 */
function calculateInvoiceTotals(lineItems, taxRate = 0) {
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
function formatCurrency(amount, currency = '$', decimals = 2) {
    return `${currency}${amount.toFixed(decimals)}`;
}
/**
 * Format a number with thousand separators
 * @param amount - The amount to format
 * @param currency - The currency symbol (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string with thousand separators
 */
function formatCurrencyWithSeparators(amount, currency = '$', decimals = 2) {
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
class InvoiceCalculator {
    /**
     * Calculate invoice totals
     */
    calculateInvoice(invoiceData) {
        // Calculate line totals for each item
        const itemsWithTotals = invoiceData.items.map((item) => ({
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
exports.InvoiceCalculator = InvoiceCalculator;
