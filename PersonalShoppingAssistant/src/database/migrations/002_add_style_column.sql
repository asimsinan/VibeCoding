-- Add style column to products table
-- This migration adds the missing style column that the ProductService expects

ALTER TABLE products ADD COLUMN IF NOT EXISTS style VARCHAR(100);

-- Add constraint for style column
ALTER TABLE products ADD CONSTRAINT products_style_check CHECK (style IS NULL OR LENGTH(style) <= 100);
