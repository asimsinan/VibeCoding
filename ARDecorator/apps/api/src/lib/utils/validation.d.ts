export declare class ValidationError extends Error {
    field?: string | undefined;
    details?: any | undefined;
    constructor(message: string, field?: string | undefined, details?: any | undefined);
}
export declare class NotFoundError extends Error {
    constructor(message: string);
}
export declare class UnauthorizedError extends Error {
    constructor(message: string);
}
export declare class ForbiddenError extends Error {
    constructor(message: string);
}
export declare function validateEmail(email: string): boolean;
export declare function validatePassword(password: string): {
    valid: boolean;
    errors: string[];
};
export declare function validateRequired(value: any, fieldName: string): void;
export declare function validateString(value: any, fieldName: string, minLength?: number, maxLength?: number): void;
export declare function validateNumber(value: any, fieldName: string, min?: number, max?: number): void;
export declare function validateEnum(value: any, fieldName: string, allowedValues: any[]): void;
export declare function sanitizeInput(input: string): string;
//# sourceMappingURL=validation.d.ts.map