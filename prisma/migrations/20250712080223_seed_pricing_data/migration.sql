-- Seed Pricing Header
INSERT INTO "pricing_headers" ("title", "subtitle", "subtitleAr", "priceListTitle", "priceListTitleAr", "contactInfo", "isActive", "createdAt", "updatedAt")
VALUES ('Laundry Link', 'NORMAL SERVICE (24HRS)', 'الخدمة العادية (٢٤ ساعة)', 'PRICE LIST', 'قائمة الأسعار', 'TEL: +973 33440841', true, NOW(), NOW());

-- Seed Pricing Categories
INSERT INTO "pricing_categories" ("name", "displayName", "description", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
('IRON / PRESS', 'Iron / Press', 'Ironing and pressing services', 1, true, NOW(), NOW()),
('WASH AND IRON', 'Wash & Iron', 'Washing and ironing services', 2, true, NOW(), NOW()),
('DRY CLEAN', 'Dry Clean', 'Dry cleaning services', 3, true, NOW(), NOW()),
('BEDDINGS', 'Beddings', 'Bedding and home textile services', 4, true, NOW(), NOW()),
('WASH AND FOLD', 'Wash & Fold', 'Washing and folding services', 5, true, NOW(), NOW());

-- Seed Pricing Items for IRON / PRESS
INSERT INTO "pricing_items" ("categoryId", "name", "displayName", "price", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
(1, 'SHIRT / TSHIRT', 'Shirt / T-shirt', 0.300, 1, true, NOW(), NOW()),
(1, 'THAWB', 'Thawb', 0.400, 2, true, NOW(), NOW()),
(1, 'GHUTRA / SHMAGH', 'Ghutra / Shmagh', 0.300, 3, true, NOW(), NOW()),
(1, 'PANTS', 'Pants', 0.300, 4, true, NOW(), NOW()),
(1, 'ABAYA', 'Abaya', 0.700, 5, true, NOW(), NOW());

-- Seed Pricing Items for WASH AND IRON
INSERT INTO "pricing_items" ("categoryId", "name", "displayName", "price", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
(2, 'SHIRT / TSHIRT', 'Shirt / T-shirt', 0.600, 1, true, NOW(), NOW()),
(2, 'THAWB', 'Thawb', 0.800, 2, true, NOW(), NOW()),
(2, 'GHUTRA / SHMAGH', 'Ghutra / Shmagh', 0.500, 3, true, NOW(), NOW()),
(2, 'PANTS', 'Pants', 0.600, 4, true, NOW(), NOW()),
(2, 'ABAYA', 'Abaya', 1.500, 5, true, NOW(), NOW()),
(2, 'SHORTS', 'Shorts', 0.500, 6, true, NOW(), NOW());

-- Seed Pricing Items for DRY CLEAN
INSERT INTO "pricing_items" ("categoryId", "name", "displayName", "price", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
(3, 'SHIRT / TSHIRT', 'Shirt / T-shirt', 0.900, 1, true, NOW(), NOW()),
(3, 'THAWB', 'Thawb', 1.300, 2, true, NOW(), NOW()),
(3, 'GHUTRA / SHMAGH', 'Ghutra / Shmagh', 0.750, 3, true, NOW(), NOW()),
(3, 'PANTS', 'Pants', 0.900, 4, true, NOW(), NOW()),
(3, 'ABAYA', 'Abaya', 2.000, 5, true, NOW(), NOW()),
(3, 'SHORTS', 'Shorts', 0.800, 6, true, NOW(), NOW()),
(3, 'JACKET NORMAL', 'Jacket Normal', 1.500, 7, true, NOW(), NOW()),
(3, 'WINTER JACKET', 'Winter Jacket', 3.000, 8, true, NOW(), NOW()),
(3, 'JACKET LEATHER', 'Jacket Leather', 4.500, 9, true, NOW(), NOW()),
(3, 'DRESS', 'Dress', 2.000, 10, true, NOW(), NOW()),
(3, 'DELICATE DRESS', 'Delicate Dress', 5.000, 11, true, NOW(), NOW()),
(3, 'TOWELS (S)', 'Towels (Small)', 0.300, 12, true, NOW(), NOW()),
(3, 'TOWELS (M)', 'Towels (Medium)', 0.500, 13, true, NOW(), NOW()),
(3, 'TOWELS (L)', 'Towels (Large)', 0.900, 14, true, NOW(), NOW()),
(3, 'SKIRT', 'Skirt', 0.800, 15, true, NOW(), NOW()),
(3, 'GALABIYAH', 'Galabiyah', 2.000, 16, true, NOW(), NOW()),
(3, 'SCARF/ HIJAB', 'Scarf/ Hijab', 0.900, 17, true, NOW(), NOW());

-- Seed Pricing Items for BEDDINGS
INSERT INTO "pricing_items" ("categoryId", "name", "displayName", "price", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
(4, 'BLANKET(S)', 'Blanket (Single)', 1.500, 1, true, NOW(), NOW()),
(4, 'BLANKET (D)', 'Blanket (Double)', 2.300, 2, true, NOW(), NOW()),
(4, 'BLANKET (K)', 'Blanket (King)', 2.900, 3, true, NOW(), NOW()),
(4, 'BED SHEET(S)', 'Bed Sheet (Single)', 1.350, 4, true, NOW(), NOW()),
(4, 'BED SHEET(B)', 'Bed Sheet (Double)', 1.750, 5, true, NOW(), NOW()),
(4, 'PILLOW CASE', 'Pillow Case', 0.500, 6, true, NOW(), NOW()),
(4, 'DUVET (S)', 'Duvet (Single)', 1.750, 7, true, NOW(), NOW()),
(4, 'DUVET (D)', 'Duvet (Double)', 2.550, 8, true, NOW(), NOW()),
(4, 'DUVET (K)', 'Duvet (King)', 3.500, 9, true, NOW(), NOW()),
(4, 'DUVET CASE (S)', 'Duvet Case (Single)', 1.500, 10, true, NOW(), NOW()),
(4, 'DUVET CASE (K/D)', 'Duvet Case (King/Double)', 2.500, 11, true, NOW(), NOW()),
(4, 'PILLOW (S)', 'Pillow (Single)', 1.000, 12, true, NOW(), NOW()),
(4, 'PILLOW(B)', 'Pillow (Double)', 2.000, 13, true, NOW(), NOW()),
(4, 'CARPET PER M2', 'Carpet per m²', 1.300, 14, true, NOW(), NOW()),
(4, 'CURTAINS PER M2', 'Curtains per m²', 0.950, 15, true, NOW(), NOW());

-- Seed Pricing Items for WASH AND FOLD
INSERT INTO "pricing_items" ("categoryId", "name", "displayName", "price", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
(5, 'MIX WASH /KG', 'Mix Wash /kg', 1.000, 1, true, NOW(), NOW()),
(5, 'SEPARATE WASH /KG', 'Separate Wash /kg', 1.500, 2, true, NOW(), NOW());