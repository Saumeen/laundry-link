-- Populate customerName and customerEmail from existing customer data
UPDATE reviews r
SET 
  "customerName" = CONCAT(c."firstName", ' ', c."lastName"),
  "customerEmail" = c.email
FROM customers c
WHERE r."customerId" = c.id;

-- Make the new fields required (NOT NULL)
ALTER TABLE reviews ALTER COLUMN "customerName" SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN "customerEmail" SET NOT NULL;
