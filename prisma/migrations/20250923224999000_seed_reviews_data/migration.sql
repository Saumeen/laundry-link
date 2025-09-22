-- Seed reviews data
-- This migration adds sample reviews to the reviews table

-- Only insert if there are customers in the database
DO $$
DECLARE
    customer_count INTEGER;
    first_customer_id INTEGER;
BEGIN
    -- Check if there are any customers
    SELECT COUNT(*) INTO customer_count FROM customers;
    
    IF customer_count > 0 THEN
        -- Get the first customer ID
        SELECT id INTO first_customer_id FROM customers LIMIT 1;
        
        -- Insert sample reviews data
        INSERT INTO "reviews" (
  "customerId",
  "rating", 
  "title",
  "comment",
  "isVerified",
  "isApproved", 
  "isPublic",
  "createdAt",
  "updatedAt"
) VALUES 
(
  first_customer_id,
  5,
  'Excellent Service!',
  'Laundry Link is an absolute game-changer. The convenience and quality are top-notch. My clothes have never looked better!',
  true,
  true,
  true,
  NOW(),
  NOW()
),
(
  first_customer_id,
  5,
  'Highly Recommend',
  'I trust Laundry Link with my most delicate garments. Their dry cleaning service is exceptional. Highly, highly recommend!',
  true,
  true,
  true,
  NOW(),
  NOW()
),
(
  first_customer_id,
  4,
  'Great Experience',
  'This service has given me back my weekends! The app is super easy to use, and their team is always punctual and professional.',
  true,
  true,
  true,
  NOW(),
  NOW()
),
(
  first_customer_id,
  5,
  'Perfect for Busy Life',
  'As a busy entrepreneur, Laundry Link saves me hours every week. The quality is consistent and the pickup/delivery is always on time.',
  true,
  true,
  true,
  NOW(),
  NOW()
),
(
  first_customer_id,
  4,
  'Student Friendly',
  'Perfect for college life! Affordable prices and they handle everything. I can focus on my studies while they take care of my laundry.',
  true,
  true,
  true,
  NOW(),
  NOW()
),
(
  first_customer_id,
  5,
  'Reliable Service',
  'Working long shifts, I need reliable service. Laundry Link never disappoints. My scrubs are always perfectly clean and ready for work.',
  true,
  true,
  true,
  NOW(),
  NOW()
),
(
  first_customer_id,
  5,
  'Makes Life Easier',
  'At my age, carrying heavy laundry bags is difficult. Laundry Link makes life so much easier. Courteous staff and excellent service!',
  true,
  true,
  true,
  NOW(),
  NOW()
),
(
  first_customer_id,
  5,
  'Family Friendly',
  'With a newborn, I have no time for laundry. Laundry Link handles all our family''s clothes with care. Baby clothes come back so soft!',
  true,
  true,
  true,
  NOW(),
  NOW()
);
        
        RAISE NOTICE 'Successfully inserted 8 sample reviews';
    ELSE
        RAISE NOTICE 'No customers found. Skipping reviews insertion.';
    END IF;
END $$;
