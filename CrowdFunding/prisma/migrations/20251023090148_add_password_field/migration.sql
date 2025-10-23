/*
  Warnings:

  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- Add password column with a default value first
ALTER TABLE "users" ADD COLUMN "password" TEXT DEFAULT 'temp_password_123';

-- Update existing users with a temporary password (they'll need to reset it)
UPDATE "users" SET "password" = 'temp_password_123' WHERE "password" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;

-- Remove the default value
ALTER TABLE "users" ALTER COLUMN "password" DROP DEFAULT;
