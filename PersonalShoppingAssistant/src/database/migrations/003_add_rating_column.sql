-- Migration 003: Add rating column to products table
-- Up migration
ALTER TABLE products
ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5.0);

-- Update existing products with random ratings for demo purposes
UPDATE products SET rating = ROUND((RANDOM() * 2 + 3)::numeric, 1) WHERE rating IS NULL;

-- Down migration
ALTER TABLE products
DROP COLUMN IF EXISTS rating;
