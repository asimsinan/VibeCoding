import { NextResponse } from 'next/server';

export function errorHandler(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return NextResponse.json(
      { 
        error: error.message || 'Bir hata oluştu',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { error: 'Bilinmeyen bir hata oluştu' },
    { status: 500 }
  );
}

