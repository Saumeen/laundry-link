-- Convert enum values to strings and update column types
-- First, add new columns with string type
ALTER TABLE "services" ADD COLUMN "pricingType_new" TEXT;
ALTER TABLE "services" ADD COLUMN "pricingUnit_new" TEXT;

-- Convert enum values to readable strings
UPDATE "services" SET 
  "pricingType_new" = CASE 
    WHEN "pricingType" = 'BY_WEIGHT' THEN 'By Weight'
    WHEN "pricingType" = 'BY_PIECE' THEN 'By Piece'
    ELSE "pricingType"::TEXT
  END,
  "pricingUnit_new" = CASE 
    WHEN "pricingUnit" = 'KG' THEN 'KG'
    WHEN "pricingUnit" = 'PIECE' THEN 'Piece'
    ELSE "pricingUnit"::TEXT
  END;

-- Drop old columns
ALTER TABLE "services" DROP COLUMN "pricingType";
ALTER TABLE "services" DROP COLUMN "pricingUnit";

-- Rename new columns to original names
ALTER TABLE "services" RENAME COLUMN "pricingType_new" TO "pricingType";
ALTER TABLE "services" RENAME COLUMN "pricingUnit_new" TO "pricingUnit";

-- Make columns NOT NULL
ALTER TABLE "services" ALTER COLUMN "pricingType" SET NOT NULL;
ALTER TABLE "services" ALTER COLUMN "pricingUnit" SET NOT NULL;

-- Drop the enum types
DROP TYPE "PricingType";
DROP TYPE "PricingUnit";
