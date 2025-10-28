# pgvector Installation Guide

## Current Status
- ✅ pgvector compiled successfully in `/tmp/pgvector`
- ❌ Installation requires sudo password
- Using JSON storage for embeddings as workaround

## Manual Installation Steps

Since sudo requires password, you need to run these manually:

```bash
# 1. Complete the installation (requires sudo password)
cd /tmp/pgvector
sudo make install

# 2. Create the extension in your database
psql postgresql://postgres:postgres@localhost:5432/legal_assistant -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 3. If the extension files are in Homebrew location but PostgreSQL is looking in /Library/PostgreSQL/17/,
#    copy them manually:
sudo cp -r /opt/homebrew/share/postgresql@17/extension/vector* /Library/PostgreSQL/17/share/postgresql/extension/
sudo cp /tmp/pgvector/vector.so /Library/PostgreSQL/17/lib/
```

## After Installation

Once pgvector is installed, update `prisma/schema.prisma`:

```prisma
model DocumentChunk {
  id          String    @id @default(uuid())
  documentId  String
  chunkText   String    @db.Text
  embedding   Unsupported("vector(768)")  // Change from Json to this
  chunkIndex  Int
  startIndex  Int
  endIndex    Int
  createdAt   DateTime  @default(now())
  
  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@index([documentId])
  @@index([chunkIndex])
  @@map("document_chunks")
}
```

Then update the code to use native pgvector queries instead of in-memory cosine similarity.

## Current Implementation

For now, the system uses:
- ✅ Embeddings stored as JSON in PostgreSQL
- ✅ Cosine similarity calculated in memory
- ✅ Fully functional semantic search

This works great for development and small datasets. Native pgvector is beneficial for large-scale production.

