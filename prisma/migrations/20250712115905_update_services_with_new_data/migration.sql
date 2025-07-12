-- Add new columns to services table
ALTER TABLE "services" ADD COLUMN "price" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "services" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'per kg';
ALTER TABLE "services" ADD COLUMN "turnaround" TEXT NOT NULL DEFAULT '24 hours';
ALTER TABLE "services" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'regular';
ALTER TABLE "services" ADD COLUMN "features" TEXT[] NOT NULL DEFAULT '{}';

-- Remove icon column
ALTER TABLE "services" DROP COLUMN "icon";

-- Update services with new data
-- First, clear existing services
DELETE FROM "services";

-- Insert the new 6 services with pricing information
INSERT INTO "services" ("name", "displayName", "description", "pricingType", "pricingUnit", "price", "unit", "turnaround", "category", "features", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('wash-fold', 'Wash & Fold', 'Our standard laundry service includes washing, drying, and folding your clothes with premium detergents and fabric softeners.', 'BY_WEIGHT', 'KG', 1.000, 'per kg', '24 hours', 'regular', ARRAY['Sorted by color and fabric type', 'Washed at appropriate temperatures', 'Folded and packaged neatly', 'Stain treatment included'], true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dry-cleaning', 'Dry Cleaning', 'Professional dry cleaning service for delicate garments, suits, dresses, and other items that require special care.', 'BY_PIECE', 'PIECE', 0.900, 'per item', '48 hours', 'premium', ARRAY['Gentle cleaning process', 'Preserves fabric quality', 'Pressed and hung', 'Individually packaged'], true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ironing', 'Ironing', 'Professional ironing service to keep your clothes looking crisp and wrinkle-free.', 'BY_PIECE', 'PIECE', 0.300, 'per item', '24 hours', 'regular', ARRAY['Pressed to perfection', 'Hung on hangers', 'Attention to detail', 'Folded upon request'], true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('express-service', 'Express Service', 'Same-day turnaround for urgent laundry needs. Perfect for last-minute events or emergencies.', 'BY_WEIGHT', 'KG', 1.500, 'per kg', '8 hours', 'premium', ARRAY['Priority processing', 'Same-day service', 'Available 7 days a week', 'Pickup and delivery included'], true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bedding-linens', 'Bedding & Linens', 'Specialized cleaning for bedsheets, duvet covers, pillowcases, towels, and other household linens.', 'BY_PIECE', 'PIECE', 1.350, 'per item', '24 hours', 'regular', ARRAY['Deep cleaning', 'Sanitizing wash', 'Proper folding', 'Fresh scent'], true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('stain-removal', 'Stain Removal', 'Expert stain removal service for tough stains on clothing, linens, and other fabrics.', 'BY_PIECE', 'PIECE', 2.000, 'per item', '48 hours', 'premium', ARRAY['Pre-treatment process', 'Specialized solutions', 'Gentle on fabrics', 'Multiple stain types'], true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);