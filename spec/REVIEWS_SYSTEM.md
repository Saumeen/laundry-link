# Reviews System - Display Only

This system allows you to display customer reviews in your testimonials section. Reviews are stored in the database and can be managed directly through the database or admin tools.

## 🗄️ Database Structure

The reviews are stored in the `reviews` table with the following structure:

```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  customerId INTEGER NOT NULL,
  orderId INTEGER, -- Optional, for order-specific reviews
  rating INTEGER NOT NULL, -- 1-5 stars
  title TEXT, -- Optional review title
  comment TEXT NOT NULL, -- Review text
  isVerified BOOLEAN DEFAULT false, -- Verified purchase
  isApproved BOOLEAN DEFAULT false, -- Admin approval
  isPublic BOOLEAN DEFAULT true, -- Show on public testimonials
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id),
  FOREIGN KEY (orderId) REFERENCES orders(id)
);
```

## 📊 API Endpoints

### GET /api/reviews
Fetches approved public reviews for display in testimonials.

**Query Parameters:**
- `limit` (optional): Number of reviews to fetch (default: 10)
- `offset` (optional): Number of reviews to skip (default: 0)

**Response:**
```json
{
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "title": "Excellent Service!",
      "comment": "Great experience...",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "customer": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "order": {
        "orderNumber": "LL-2024-001"
      }
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

## 🎨 Frontend Components

### Testimonials Component
The `Testimonials` component automatically fetches and displays reviews from the database. It includes:
- Star ratings
- Verification badges
- Order numbers (if available)
- Automatic sliding animation
- Fallback to demo data if no reviews exist

## 📝 Adding Reviews to Database

### Method 1: Using the Migration (Recommended)
The sample reviews are automatically added via migration when you run:
```bash
npx prisma migrate deploy
```

This migration will:
- Check if customers exist in the database
- Add 8 sample reviews if customers are found
- Skip insertion if no customers exist
- Show appropriate success/error messages

### Method 2: Direct Database Insert
```sql
INSERT INTO reviews (
  customerId, 
  rating, 
  title, 
  comment, 
  isVerified, 
  isApproved, 
  isPublic
) VALUES (
  1, -- Replace with actual customer ID
  5,
  'Amazing Service!',
  'The best laundry service I have ever used. Highly recommended!',
  true,
  true,
  true
);
```

### Method 3: Using Prisma Client
```javascript
const review = await prisma.review.create({
  data: {
    customerId: 1,
    rating: 5,
    title: "Great Service",
    comment: "Excellent quality and fast delivery!",
    isVerified: true,
    isApproved: true,
    isPublic: true,
  },
});
```

## 🔧 Review Management

### To Approve a Review
```sql
UPDATE reviews 
SET isApproved = true, isPublic = true 
WHERE id = 1;
```

### To Hide a Review
```sql
UPDATE reviews 
SET isPublic = false 
WHERE id = 1;
```

### To Delete a Review
```sql
DELETE FROM reviews WHERE id = 1;
```

## 📱 Display Features

- **Star Ratings**: Visual 1-5 star display
- **Verification Badges**: Shows "Verified" for reviews linked to orders
- **Order Numbers**: Displays order number for order-specific reviews
- **Responsive Design**: Works on all device sizes
- **Automatic Updates**: Testimonials update when new reviews are added to database

## 🎯 Best Practices

1. **Quality Control**: Only approve high-quality, genuine reviews
2. **Verification**: Link reviews to actual orders when possible
3. **Diversity**: Include reviews from different customer types
4. **Regular Updates**: Add new reviews regularly to keep testimonials fresh
5. **Moderation**: Review content before making it public

## 🚀 Getting Started

1. **Run Migration**: The sample reviews are automatically added when you run `npx prisma migrate deploy`
2. **Verify Display**: Check that testimonials show on your landing page
3. **Add Real Reviews**: Add actual customer reviews to the database using SQL or Prisma
4. **Monitor**: Regularly check and update your reviews

The system is now ready to display reviews from your database without allowing user submissions!
