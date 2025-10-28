import { NextResponse } from 'next/server';

/**
 * Format document response for API
 */
export function formatDocumentResponse(document: any) {
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    filePath: document.filePath,
    fileSize: document.fileSize,
    mimeType: document.mimeType,
    extractedText: document.extractedText,
    userId: document.userId,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

/**
 * Format chat session response for API
 */
export function formatChatSessionResponse(session: any) {
  return {
    id: session.id,
    userId: session.userId,
    documentId: session.documentId,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

/**
 * Format chat message response for API
 */
export function formatChatMessageResponse(message: any) {
  return {
    id: message.id,
    sessionId: message.sessionId,
    role: message.role,
    content: message.content,
    metadata: message.metadata,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
}

/**
 * Format pagination response
 */
export function formatPaginationResponse(
  items: any[],
  total: number,
  page: number,
  limit: number
) {
  return {
    [Array.isArray(items) && items.length > 0 && 'title' in items[0] ? 'documents' : 'items']: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Format documents pagination response
 */
export function formatDocumentsPaginationResponse(
  documents: any[],
  total: number,
  page: number,
  limit: number
) {
  return {
    documents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Create success response
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Create error response
 */
export function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json(
    {
      error: message,
      code
    },
    { status }
  );
}

