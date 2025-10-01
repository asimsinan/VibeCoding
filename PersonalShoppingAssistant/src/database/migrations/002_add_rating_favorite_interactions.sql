-- Migration: Add rating and favorite interaction types
-- This migration adds 'rating' and 'favorite' to the allowed interaction types

-- Drop the existing check constraint
ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_type_check;

-- Add the new check constraint with all allowed interaction types
ALTER TABLE interactions ADD CONSTRAINT interactions_type_check 
    CHECK (type IN ('view', 'like', 'dislike', 'purchase', 'rating', 'favorite'));

-- Update the comment to reflect the new interaction types
COMMENT ON COLUMN interactions.type IS 'Type of interaction: view, like, dislike, purchase, rating, favorite';
