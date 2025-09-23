
# Landing Page CMS Specification

## 1. Overview

The goal is to transform the static landing page into a dynamic, CMS-driven page. All content, including text and images, will be editable from a super admin panel. Images will be stored using Vercel Blob Storage, and the content will be saved in the database.

## 2. Data Models

We will introduce a new model, `LandingPage`, to store the content for the different sections of the landing page.

### 2.1. `LandingPage` Model

This model will store the content for the entire landing page in a structured JSON format.

-   `id`: string (unique identifier)
-   `pageName`: string (e.g., "default")
-   `content`: JSON
-   `createdAt`: DateTime
-   `updatedAt`: DateTime

The `content` JSON will have the following structure:

```json
{
  "hero": {
    "title": "String",
    "subtitle": "String",
    "ctaText": "String",
    "image": "URL"
  },
  "howItWorks": {
    "title": "String",
    "steps": [
      { "id": "1", "title": "String", "description": "String", "icon": "URL" },
      { "id": "2", "title": "String", "description": "String", "icon": "URL" },
      { "id": "3", "title": "String", "description": "String", "icon": "URL" }
    ]
  },
  "services": {
    "title": "String",
    "items": [
      { "id": "1", "name": "String", "description": "String", "image": "URL" },
      { "id": "2", "name": "String", "description": "String", "image": "URL" },
      { "id": "3", "name": "String", "description": "String", "image": "URL" }
    ]
  },
  "testimonials": {
    "title": "String",
    "displayMode": "auto" | "manual", // "auto" = show approved public reviews, "manual" = select specific reviews
    "selectedReviewIds": [1, 2, 3] // Only used when displayMode is "manual"
  },
  "whyChooseUs": {
    "title": "String",
    "reasons": [
      { "id": "1", "title": "String", "description": "String", "icon": "URL" },
      { "id": "2", "title": "String", "description": "String", "icon": "URL" },
      { "id": "3", "title": "String", "description": "String", "icon": "URL" }
    ]
  }
}
```

**Note on Testimonials**: The testimonials section will utilize the existing `Review` table instead of storing testimonial data in the `LandingPage` content. The `testimonials` configuration above controls how reviews are displayed on the landing page.

## 3. API Endpoints

We will create the following API endpoints to manage the landing page content.

### 3.1. Super Admin Endpoints

-   **`POST /api/admin/landing`**: Create or update the landing page content.
    -   **Request Body**: `content` (JSON)
    -   **Authentication**: Super admin only.
    -   **Functionality**: This endpoint will handle image uploads to Vercel Blob Storage for any image URLs present in the request body. It will then save the entire `content` object to the database.

-   **`GET /api/admin/landing`**: Retrieve the landing page content for the admin panel.
    -   **Authentication**: Super admin only.

-   **`GET /api/admin/reviews/approved`**: Fetch approved reviews for the admin panel to select from.
    -   **Authentication**: Super admin only.
    -   **Functionality**: Returns all approved reviews (`isApproved: true`) with customer information for manual testimonial selection.

### 3.2. Public Endpoints

-   **`GET /api/landing`**: Fetch the landing page content for public viewing.
    -   **Authentication**: None.
    -   **Functionality**: This will be a cached endpoint to ensure fast load times for the landing page.

-   **`GET /api/reviews/testimonials`**: Fetch testimonials for the landing page.
    -   **Authentication**: None.
    -   **Query Parameters**:
        - `limit`: Number of reviews to return (default: 6)
        - `ids`: Comma-separated list of specific review IDs (when displayMode is "manual")
    -   **Functionality**: Returns approved and public reviews from the `Review` table, including customer information. When specific IDs are provided, only those reviews are returned.

## 4. Backend Implementation

-   **Database Schema**: Update the Prisma schema to include the `LandingPage` model.
-   **API Routes**: Implement the API routes described above using Next.js API routes, including the reviews testimonials endpoint that queries the existing `Review` table.
-   **Image Upload**: Use the Vercel Blob Storage SDK to handle image uploads. The backend will receive base64 encoded images, upload them to Vercel, and replace the base64 string with the returned URL before saving to the database.
-   **Authentication**: Protect the admin endpoints using the existing super admin authentication middleware.

## 5. Frontend Implementation

### 5.1. Landing Page (`src/app/page.tsx`)

-   Fetch the landing page content from the `GET /api/landing` endpoint using a server-side fetch request to ensure the page is server-rendered with the dynamic content.
-   Fetch testimonials from the `GET /api/reviews/testimonials` endpoint using the configuration from the landing page content (displayMode and selectedReviewIds).
-   Pass the fetched content as props to the respective components (`Hero`, `HowItWorks`, etc.).
-   Pass the fetched testimonials to the `Testimonials` component.

### 5.2. Landing Page Components (`src/components/landing/*.tsx`)

-   Refactor each component to accept its content as props and render it dynamically.
-   Remove all static text and image URLs, replacing them with the props passed down from the main page.
-   The `Testimonials` component will be updated to:
     - Accept testimonials data as props
     - Display reviews based on the testimonials configuration
     - Show customer names and ratings from the Review table data
     - Handle both automatic and manual display modes

### 5.3. Super Admin Panel

-   Create a new page in the super admin dashboard for managing the landing page content.
-   The page will feature a form with fields for all the editable content, including text inputs, text areas, and file inputs for images.
-   For testimonials management:
     - Display a dropdown to select display mode ("auto" or "manual")
     - When "manual" mode is selected, show a multi-select component to choose specific approved reviews
     - Fetch available reviews from a separate API endpoint that returns approved reviews with customer information
-   When the form is submitted, the frontend will read the images as base64 strings and send the entire content object to the `POST /api/admin/landing` endpoint.
-   The form should be pre-filled with the existing content fetched from `GET /api/admin/landing`.

## 6. Vercel Blob Storage

-   Configure Vercel Blob Storage in the project.
-   Ensure that the necessary environment variables are set up for the Vercel Blob SDK.

## 7. Caching

-   Implement caching on the `GET /api/landing` endpoint to reduce database queries and improve performance. A time-based revalidation strategy (e.g., revalidate every 60 seconds) would be appropriate.

This specification provides a comprehensive plan for transforming the static landing page into a dynamic, CMS-driven page. By following this plan, we can ensure that all requirements are met and the implementation is smooth and efficient.
