# Current RAG Architecture - Legal Assistant

## Current Implementation (Non-Vector Based)

### How It Works Now:

1. **Document Upload**: ✅ Works
   - User uploads PDF/DOCX
   - File saved to disk
   - Metadata stored in PostgreSQL
   - ❌ **Text extraction FAILED** (webpack/pdfjs-dist compatibility issue)

2. **Document Storage**: ✅ Works
   - Document metadata in `documents` table
   - `extractedText` field is NULL (because parsing failed)
   - File stored on disk

3. **Chat with Document**: ❌ Partially Works
   - User selects a document when creating chat session
   - Chat API receives `session.documentId`
   - It tries to get `document.extractedText`
   - Since `extractedText` is empty → falls back to basic Gemini generation
   - **No actual RAG is happening**

4. **Current "RAG" Service** (`src/lib/rag-service/search.ts`):
   - Uses simple text matching (keyword search)
   - Chunks documents by character count
   - Uses `calculateRelevance()` - simple TF-IDF-like scoring
   - **NOT using vector embeddings**
   - **NOT using pgvector**

## Problem

The current system is **pseudo-RAG**:
- No actual semantic search
- No vector embeddings stored
- No similarity search
- Just keyword matching

## Recommended Solution: pgvector with Embeddings

### What We Need:

1. **Add pgvector extension** to PostgreSQL
2. **Create embeddings table**:
   ```prisma
   model DocumentChunk {
     id          String   @id @default(uuid())
     documentId  String
     chunkText  String   @db.Text
     embedding  Unsupported("vector(768)") @db.Unsupported("vector(768)")
     chunkIndex Int
     startIndex Int
     endIndex   Int
     createdAt  DateTime @default(now())
     
     document    Document @relation(fields: [documentId], references: [id])
     
     @@index([documentId])
     @@map("document_chunks")
   }
   ```

3. **Generate embeddings** when PDF is uploaded:
   - Extract text from PDF (fix the parser!)
   - Use a text embedding API (OpenAI, Google, or self-hosted)
   - Chunk the text
   - Generate embeddings for each chunk
   - Store in `document_chunks` table

4. **Search during chat**:
   - When user sends message, generate query embedding
   - Use `pgvector` to find similar chunks:
     ```sql
     SELECT * FROM document_chunks
     WHERE document_id = $1
     ORDER BY embedding <=> $2::vector
     LIMIT 5
     ```
   - Feed top chunks to Gemini as context

### Required Steps:

1. ✅ Install pgvector extension in PostgreSQL
2. ✅ Add `DocumentChunk` model to Prisma schema
3. ✅ Choose embedding provider (OpenAI or Google)
4. ⚠️ Fix PDF text extraction (currently disabled)
5. ✅ Create embedding service
6. ✅ Update upload flow to generate & store embeddings
7. ✅ Update chat to use pgvector semantic search

## Why Current RAG Doesn't Work:

Looking at your logs:
```
Document retrieved: "KVKK Aydınlatma Metni.pdf"
Document has extractedText: NO
No extracted text, using basic generation
```

Since `extractedText` is empty, the RAG service can't retrieve chunks. The system falls back to basic Gemini without context.

## Immediate Action Items:

1. **Fix PDF parsing** - Use a server-side solution (maybe Python microservice?)
2. **Add pgvector support** - Install extension and update schema
3. **Generate embeddings** - Add embedding generation on upload
4. **Update search** - Use vector similarity search

Would you like me to implement the full pgvector-based RAG system?

