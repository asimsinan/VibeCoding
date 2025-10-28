import { NextResponse } from 'next/server';

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  data: Record<string, any>,
  fields: string[]
): NextResponse | null {
  const missingFields = fields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: `Eksik alanlar: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR',
        missingFields
      },
      { status: 400 }
    );
  }
  
  return null;
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number, maxSize: number): boolean {
  return fileSize <= maxSize;
}

/**
 * Validate user ID format (UUID)
 */
export function validateUserId(userId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

