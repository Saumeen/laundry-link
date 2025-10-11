-- Manual Migration 3: Remove customerId from reviews table
-- This should be run manually if prisma migrate dev encounters drift issues

-- Step 1: Drop the foreign key constraint
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_customerId_fkey";

-- Step 2: Drop the customerId column
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "customerId";

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;

