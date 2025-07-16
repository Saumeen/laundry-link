-- Insert service pricing mappings based on service types and pricing categories
-- Wash & Fold Service Mappings
INSERT INTO "service_pricing_mappings" ("serviceId", "pricingItemId", "isDefault", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT 
    s.id as serviceId,
    pi.id as pricingItemId,
    CASE 
        WHEN pi.name = 'MIX WASH /KG' THEN true
        ELSE false
    END as isDefault,
    pi."sortOrder",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "services" s
CROSS JOIN "pricing_items" pi
JOIN "pricing_categories" pc ON pi."categoryId" = pc.id
WHERE s.name = 'wash-fold' 
AND pc.name IN ('WASH AND FOLD', 'WASH AND IRON', 'BEDDINGS');

-- Dry Cleaning Service Mappings
INSERT INTO "service_pricing_mappings" ("serviceId", "pricingItemId", "isDefault", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT 
    s.id as serviceId,
    pi.id as pricingItemId,
    CASE 
        WHEN pi.name = 'SHIRT / TSHIRT' THEN true
        ELSE false
    END as isDefault,
    pi."sortOrder",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "services" s
CROSS JOIN "pricing_items" pi
JOIN "pricing_categories" pc ON pi."categoryId" = pc.id
WHERE s.name = 'dry-cleaning' 
AND pc.name = 'DRY CLEAN';

-- Ironing Service Mappings
INSERT INTO "service_pricing_mappings" ("serviceId", "pricingItemId", "isDefault", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT 
    s.id as serviceId,
    pi.id as pricingItemId,
    CASE 
        WHEN pi.name = 'SHIRT / TSHIRT' THEN true
        ELSE false
    END as isDefault,
    pi."sortOrder",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "services" s
CROSS JOIN "pricing_items" pi
JOIN "pricing_categories" pc ON pi."categoryId" = pc.id
WHERE s.name = 'ironing' 
AND pc.name = 'IRON / PRESS';

-- Express Service Mappings (can handle all types)
INSERT INTO "service_pricing_mappings" ("serviceId", "pricingItemId", "isDefault", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT 
    s.id as serviceId,
    pi.id as pricingItemId,
    CASE 
        WHEN pi.name = 'SHIRT / TSHIRT' THEN true
        ELSE false
    END as isDefault,
    pi."sortOrder",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "services" s
CROSS JOIN "pricing_items" pi
JOIN "pricing_categories" pc ON pi."categoryId" = pc.id
WHERE s.name = 'express-service';

-- Bedding & Linens Service Mappings
INSERT INTO "service_pricing_mappings" ("serviceId", "pricingItemId", "isDefault", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT 
    s.id as serviceId,
    pi.id as pricingItemId,
    CASE 
        WHEN pi.name = 'BED SHEET(S)' THEN true
        ELSE false
    END as isDefault,
    pi."sortOrder",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "services" s
CROSS JOIN "pricing_items" pi
JOIN "pricing_categories" pc ON pi."categoryId" = pc.id
WHERE s.name = 'bedding-linens' 
AND pc.name IN ('BEDDINGS', 'WASH AND FOLD');

-- Stain Removal Service Mappings (can be applied to all items)
INSERT INTO "service_pricing_mappings" ("serviceId", "pricingItemId", "isDefault", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT 
    s.id as serviceId,
    pi.id as pricingItemId,
    CASE 
        WHEN pi.name = 'SHIRT / TSHIRT' THEN true
        ELSE false
    END as isDefault,
    pi."sortOrder",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "services" s
CROSS JOIN "pricing_items" pi
JOIN "pricing_categories" pc ON pi."categoryId" = pc.id
WHERE s.name = 'stain-removal'; 