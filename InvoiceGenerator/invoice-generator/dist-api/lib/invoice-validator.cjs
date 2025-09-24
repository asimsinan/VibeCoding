"use strict";
/**
 * Invoice Validator Library
 *
 * Core validation logic for client information, line items,
 * and other invoice data validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceValidator = void 0;
exports.validateClient = validateClient;
exports.validateLineItem = validateLineItem;
exports.isValidEmail = isValidEmail;
exports.validateRequiredFields = validateRequiredFields;
exports.validateTaxRate = validateTaxRate;
exports.validateInvoiceNumber = validateInvoiceNumber;
exports.validateDate = validateDate;
exports.validateInvoice = validateInvoice;
/**
 * Validate client information
 * @param client - Client object to validate
 * @returns Validation result with errors if any
 */
function validateClient(client) {
    const errors = [];
    if (!client.name || client.name.trim().length === 0) {
        errors.push({ field: 'client.name', message: 'Client name is required', code: 'REQUIRED_FIELD' });
    }
    else if (client.name.length > 100) {
        errors.push({ field: 'client.name', message: 'Client name must be 100 characters or less', code: 'MAX_LENGTH_EXCEEDED' });
    }
    if (!client.address || client.address.trim().length === 0) {
        errors.push({ field: 'client.address', message: 'Client address is required', code: 'REQUIRED_FIELD' });
    }
    else if (client.address.length > 200) {
        errors.push({ field: 'client.address', message: 'Client address must be 200 characters or less', code: 'MAX_LENGTH_EXCEEDED' });
    }
    if (!client.email || client.email.trim().length === 0) {
        errors.push({ field: 'client.email', message: 'Client email is required', code: 'REQUIRED_FIELD' });
    }
    else if (!isValidEmail(client.email)) {
        errors.push({ field: 'client.email', message: 'Invalid email format', code: 'INVALID_EMAIL_FORMAT' });
    }
    if (client.phone && client.phone.length > 20) {
        errors.push({ field: 'client.phone', message: 'Client phone must be 20 characters or less', code: 'MAX_LENGTH_EXCEEDED' });
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate a single line item
 * @param lineItem - Line item object to validate
 * @returns Validation result with errors if any
 */
function validateLineItem(lineItem) {
    const errors = [];
    if (!lineItem.description || lineItem.description.trim().length === 0) {
        errors.push({ field: 'items.description', message: 'Description is required', code: 'REQUIRED_FIELD' });
    }
    else if (lineItem.description.length > 200) {
        errors.push({ field: 'items.description', message: 'Description must be 200 characters or less', code: 'MAX_LENGTH_EXCEEDED' });
    }
    if (lineItem.quantity <= 0) {
        errors.push({ field: 'items.quantity', message: 'Quantity must be positive', code: 'INVALID_VALUE' });
    }
    if (lineItem.unitPrice < 0) {
        errors.push({ field: 'items.unitPrice', message: 'Unit price cannot be negative', code: 'INVALID_VALUE' });
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate email format
 * @param email - Email string to validate
 * @returns True if email is valid, false otherwise
 */
function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(email) && !email.includes('..');
}
/**
 * Validate required fields in an object
 * @param data - Object to validate
 * @param requiredFields - Array of required field names
 * @returns Validation result with errors if any
 */
function validateRequiredFields(data, requiredFields) {
    const errors = [];
    requiredFields.forEach(field => {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            errors.push({ field, message: `${field} is required`, code: 'REQUIRED_FIELD' });
        }
    });
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate tax rate
 * @param taxRate - Tax rate to validate
 * @returns Validation result with errors if any
 */
function validateTaxRate(taxRate) {
    const errors = [];
    if (taxRate < 0) {
        errors.push({ field: 'taxRate', message: 'Tax rate cannot be negative', code: 'INVALID_VALUE' });
    }
    if (taxRate > 100) {
        errors.push({ field: 'taxRate', message: 'Tax rate cannot exceed 100%', code: 'INVALID_VALUE' });
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate invoice number format
 * @param invoiceNumber - Invoice number to validate
 * @returns Validation result with errors if any
 */
function validateInvoiceNumber(invoiceNumber) {
    const errors = [];
    if (!invoiceNumber || invoiceNumber.trim().length === 0) {
        errors.push({ field: 'invoiceNumber', message: 'Invoice number is required', code: 'REQUIRED_FIELD' });
    }
    else if (invoiceNumber.length > 50) {
        errors.push({ field: 'invoiceNumber', message: 'Invoice number must be 50 characters or less', code: 'MAX_LENGTH_EXCEEDED' });
    }
    else if (!/^[A-Z0-9-_]+$/.test(invoiceNumber)) {
        errors.push({ field: 'invoiceNumber', message: 'Invoice number can only contain uppercase letters, numbers, hyphens, and underscores', code: 'INVALID_FORMAT' });
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate date format (YYYY-MM-DD)
 * @param date - Date string to validate
 * @returns Validation result with errors if any
 */
function validateDate(date) {
    const errors = [];
    if (!date || date.trim().length === 0) {
        errors.push({ field: 'date', message: 'Date is required', code: 'REQUIRED_FIELD' });
    }
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push({ field: 'date', message: 'Date must be in YYYY-MM-DD format', code: 'INVALID_FORMAT' });
    }
    else {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            errors.push({ field: 'date', message: 'Date must be a valid date', code: 'INVALID_DATE' });
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate complete invoice data
 * @param invoice - Invoice object to validate
 * @returns Validation result with errors if any
 */
function validateInvoice(invoice) {
    const errors = [];
    // Validate client
    const clientValidation = validateClient(invoice.client);
    if (!clientValidation.isValid) {
        errors.push(...clientValidation.errors);
    }
    // Validate line items
    if (!invoice.items || invoice.items.length === 0) {
        errors.push({ field: 'items', message: 'At least one line item is required', code: 'REQUIRED_FIELD' });
    }
    else {
        invoice.items.forEach((item, index) => {
            const itemValidation = validateLineItem(item);
            if (!itemValidation.isValid) {
                // Update field names to include index
                const indexedErrors = itemValidation.errors.map(error => ({
                    ...error,
                    field: error.field.replace('items.', `items[${index}].`)
                }));
                errors.push(...indexedErrors);
            }
        });
    }
    // Validate tax rate if provided
    if (invoice.taxRate !== undefined) {
        const taxValidation = validateTaxRate(invoice.taxRate);
        if (!taxValidation.isValid) {
            errors.push(...taxValidation.errors);
        }
    }
    // Validate invoice number if provided
    if (invoice.invoiceNumber !== undefined) {
        const invoiceNumberValidation = validateInvoiceNumber(invoice.invoiceNumber);
        if (!invoiceNumberValidation.isValid) {
            errors.push(...invoiceNumberValidation.errors);
        }
    }
    // Validate date if provided
    if (invoice.date !== undefined) {
        const dateValidation = validateDate(invoice.date);
        if (!dateValidation.isValid) {
            errors.push(...dateValidation.errors);
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Invoice Validator Class
 *
 * Main class for validating invoice data
 */
class InvoiceValidator {
    /**
     * Validate complete invoice data
     * @param invoice - Invoice object to validate
     * @returns Validation result with errors if any
     */
    validateInvoice(invoice) {
        return validateInvoice(invoice);
    }
    /**
     * Validate client information
     * @param client - Client object to validate
     * @returns Validation result with errors if any
     */
    validateClient(client) {
        return validateClient(client);
    }
    /**
     * Validate a single line item
     * @param lineItem - Line item object to validate
     * @returns Validation result with errors if any
     */
    validateLineItem(lineItem) {
        return validateLineItem(lineItem);
    }
}
exports.InvoiceValidator = InvoiceValidator;
