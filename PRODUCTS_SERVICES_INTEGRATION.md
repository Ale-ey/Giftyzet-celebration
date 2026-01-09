# Products & Services Integration with Supabase

## Overview
This document explains the complete integration of products and services management with Supabase, including image upload functionality.

## Features Implemented

### ✅ Vendor Product Management
- Create products with image upload
- Update products with new images
- Delete products (automatically deletes associated images)
- View all products for a store
- Stock management
- Availability toggle

### ✅ Vendor Service Management
- Create services with image upload
- Update services with new images
- Delete services (automatically deletes associated images)
- View all services for a store
- Duration and location fields
- Availability toggle

### ✅ Image Upload
- Direct upload to Supabase Storage
- File validation (type and size)
- Image preview before upload
- Automatic cleanup on product/service deletion
- Public URL generation for images

### ✅ No Dummy Data
- Removed all localStorage-based dummy data
- Removed hardcoded product/service arrays
- Clean slate for vendors to add their own products

## Architecture

### Database Tables

#### Products Table
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category TEXT NOT NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Services Table
```sql
CREATE TABLE public.services (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category TEXT NOT NULL,
  image_url TEXT,
  duration TEXT,
  location TEXT,
  available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage Structure

```
products/ (bucket)
├── {store-id}/
│   ├── {timestamp}_{random}.jpg
│   ├── {timestamp}_{random}.png
│   └── ...
└── ...

services/ (bucket)
├── {store-id}/
│   ├── {timestamp}_{random}.jpg
│   └── ...
└── ...
```

## API Functions

### Product API (`lib/api/products.ts`)

#### Create Product
```typescript
await createProduct(storeId, {
  name: "Product Name",
  description: "Description",
  price: 99.99,
  original_price: 129.99,
  category: "Electronics",
  stock: 100,
  available: true
}, imageFile)
```

#### Update Product
```typescript
await updateProduct(productId, {
  name: "Updated Name",
  price: 89.99,
  available: false
}, newImageFile, storeId)
```

#### Delete Product
```typescript
await deleteProduct(productId)
// Automatically deletes associated image
```

#### Get Products by Store
```typescript
const products = await getProductsByStore(storeId)
```

#### Get Approved Products (Marketplace)
```typescript
const products = await getApprovedProducts(limit)
// Returns products from approved stores only
```

### Service API (Same pattern as products)

```typescript
// Create
await createService(storeId, serviceData, imageFile)

// Update
await updateService(serviceId, serviceData, imageFile, storeId)

// Delete
await deleteService(serviceId)

// Get by store
const services = await getServicesByStore(storeId)

// Get approved (marketplace)
const services = await getApprovedServices(limit)
```

### Image Upload API

```typescript
// Upload product image
const imageUrl = await uploadProductImage(file, storeId)

// Upload service image
const imageUrl = await uploadServiceImage(file, storeId)

// Delete image
await deleteImage(imageUrl)
```

## Components

### VendorProductsPage
**Path:** `components/vendor/VendorProductsPage.tsx`

Main page for vendors to manage products and services:
- Tab interface (Products / Services)
- Grid layout with product/service cards
- Add, edit, delete actions
- Image display with fallback icons
- Loading states
- Pagination
- Real-time data from Supabase

### AddProductDialog
**Path:** `components/vendor/AddProductDialog.tsx`

Modal for creating/editing products:
- Form validation
- Image upload with preview
- File size/type validation
- Price fields (sale and original)
- Stock management
- Category selection
- Availability toggle
- Loading states during save
- Error handling

### AddServiceDialog
**Path:** `components/vendor/AddServiceDialog.tsx`

Modal for creating/editing services:
- Similar to AddProductDialog
- Additional fields: duration, location
- Image upload with preview
- Category selection
- Availability toggle

## User Flow

### Adding a Product

1. Vendor clicks "Add Product" button
2. Dialog opens with empty form
3. Vendor fills in:
   - Product name *
   - Description
   - Sale price *
   - Original price (optional)
   - Stock quantity
   - Category *
   - Image *
   - Availability checkbox
4. Vendor uploads image (validated for type/size)
5. Preview shows immediately
6. Vendor clicks "Add Product"
7. API uploads image to Supabase Storage
8. API creates product record with image URL
9. Product list refreshes automatically

### Editing a Product

1. Vendor clicks "Edit" on product card
2. Dialog opens with pre-filled form
3. Existing image shows in preview
4. Vendor can update any field
5. Vendor can upload new image (replaces old one)
6. Vendor clicks "Update Product"
7. API updates product record
8. If new image uploaded, replaces old image
9. Product list refreshes

### Deleting a Product

1. Vendor clicks delete icon on product card
2. Confirmation modal appears
3. Vendor confirms deletion
4. API deletes product record
5. API automatically deletes associated image from storage
6. Product list refreshes

## Security

### RLS Policies

#### Products/Services Tables
```sql
-- Vendors can only manage products in their own stores
CREATE POLICY "Vendors can manage own products" ON products
FOR ALL USING (
  store_id IN (
    SELECT id FROM stores 
    WHERE vendor_id IN (
      SELECT id FROM vendors 
      WHERE user_id = auth.uid()
    )
  )
);

-- Public can view products from approved stores
CREATE POLICY "Public can view approved products" ON products
FOR SELECT USING (
  store_id IN (
    SELECT id FROM stores 
    WHERE status = 'approved'
  )
);
```

#### Storage Policies
```sql
-- Vendors can upload to their store folder only
CREATE POLICY "Vendors can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM stores s
    JOIN vendors v ON v.id = s.vendor_id
    WHERE v.user_id = auth.uid()
    AND (storage.foldername(name))[2] = s.id::text
  )
);

-- Anyone can view product images
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');
```

## Setup Instructions

### 1. Apply Database Schema
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/schema.sql
```

### 2. Create Storage Buckets
Via Supabase Dashboard:

**Products Bucket:**
- Go to Storage
- Click "Create bucket"
- Name: `products`
- Public: **Yes** ✓
- File size limit: 5MB

**Services Bucket:**
- Click "Create bucket" again
- Name: `services`
- Public: **Yes** ✓
- File size limit: 5MB

Or via CLI:
```bash
supabase storage create products --public
supabase storage create services --public
```

### 3. Apply Storage Policies
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/product_storage_setup.sql
```

### 4. Test the Flow
1. Login as vendor (store must be approved)
2. Go to Vendor Dashboard > Products & Services
3. Add a product with image
4. Verify image uploads to Supabase Storage
5. Verify product appears in list
6. Edit product, change image
7. Delete product, verify image deleted

## Error Handling

### Image Upload Errors
- **File too large**: Alert shows "Image size should be less than 5MB"
- **Invalid file type**: Alert shows "Please select an image file"
- **Upload failed**: Alert shows API error message

### Product/Service Save Errors
- **Missing required fields**: Alert shows "Please fill in all required fields"
- **Missing store ID**: Alert shows "Store ID is missing"
- **API error**: Alert shows specific error message from Supabase

### Delete Errors
- **API error**: Alert shows "Failed to delete {product/service}"
- Image cleanup errors are logged but don't block deletion

## Data Migration

### From Dummy Data to Real Data

If you have existing dummy data in localStorage:

1. **No automatic migration** - Start fresh
2. Vendors must add their products manually
3. Old dummy data is ignored
4. Clean slate approach ensures data consistency

### Future: Import Feature
Could add CSV import for bulk product creation:
```typescript
async function importProducts(csvFile: File, storeId: string) {
  // Parse CSV
  // Validate data
  // Bulk insert to Supabase
  // Handle image URLs or upload images
}
```

## Performance Considerations

### Image Optimization
- **Current**: Images uploaded as-is (up to 5MB)
- **Future**: Add image compression before upload
- **CDN**: Supabase Storage has built-in CDN

### Pagination
- Products page shows 12 items per page
- Reduces initial load time
- Smooth scrolling experience

### Caching
- Images cached by browser (via Supabase CDN)
- Product data fetched on page load
- Refetched after mutations (add/edit/delete)

## Marketplace Integration

Products and services from approved stores automatically appear in marketplace:

```typescript
// Get marketplace products
const products = await getApprovedProducts()
// Returns only products from stores with status='approved'

// Includes store and vendor info
products.forEach(product => {
  console.log(product.stores.name) // Store name
  console.log(product.stores.vendors.vendor_name) // Vendor name
})
```

## Troubleshooting

### Images Not Uploading
1. Check storage buckets exist: `products` and `services`
2. Check both buckets are public
3. Check storage policies are applied
4. Check vendor has approved store
5. Check file size < 5MB
6. Check file is valid image type

### Products Not Showing
1. Check store status is "approved"
2. Check RLS policies allow access
3. Check vendor owns the store
4. Check browser console for API errors

### Delete Not Working
1. Check vendor owns the product
2. Check RLS policies allow deletion
3. Check product ID is valid UUID
4. Check network tab for API errors

## Future Enhancements

- [ ] Bulk upload (CSV import)
- [ ] Image gallery (multiple images per product)
- [ ] Image cropping/editing tool
- [ ] Product variants (size, color, etc.)
- [ ] Inventory management
- [ ] Product analytics
- [ ] SEO optimization (meta tags)
- [ ] Product search and filters
- [ ] Categories with images
- [ ] Related products

