-- ============================================
-- Product and Service Image Storage Setup
-- Using separate 'products' and 'services' buckets
-- ============================================

-- This file contains the storage policies for the products and services buckets
-- Run this in Supabase SQL Editor after creating the buckets

-- ============================================
-- PRODUCTS BUCKET POLICIES
-- ============================================

-- Allow authenticated vendors to upload product images to their store folders
CREATE POLICY "Vendors can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  -- Check if user is vendor and owns a store
  -- File path format: {store-id}/{filename}
  (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM public.stores s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE v.user_id = auth.uid()
  )
);

-- Allow vendors to update their own product images
CREATE POLICY "Vendors can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM public.stores s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE v.user_id = auth.uid()
  )
);

-- Allow vendors to delete their own product images
CREATE POLICY "Vendors can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM public.stores s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE v.user_id = auth.uid()
  )
);

-- Allow public to view product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- ============================================
-- SERVICES BUCKET POLICIES
-- ============================================

-- Allow authenticated vendors to upload service images to their store folders
CREATE POLICY "Vendors can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'services' AND
  -- Check if user is vendor and owns a store
  -- File path format: {store-id}/{filename}
  (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM public.stores s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE v.user_id = auth.uid()
  )
);

-- Allow vendors to update their own service images
CREATE POLICY "Vendors can update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'services' AND
  (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM public.stores s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE v.user_id = auth.uid()
  )
);

-- Allow vendors to delete their own service images
CREATE POLICY "Vendors can delete service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'services' AND
  (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM public.stores s
    JOIN public.vendors v ON v.id = s.vendor_id
    WHERE v.user_id = auth.uid()
  )
);

-- Allow public to view service images
CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'services');

-- ============================================
-- BUCKET CONFIGURATION
-- ============================================

/*
Make sure your buckets are configured correctly:

1. PRODUCTS BUCKET:
   - Name: products
   - Public: Yes (for public image access)
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

2. SERVICES BUCKET:
   - Name: services
   - Public: Yes (for public image access)
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

To check/update bucket settings, go to:
Supabase Dashboard > Storage > Click on bucket > Settings

Bucket Public Access:
- Both buckets should be PUBLIC to allow public image viewing
*/

-- ============================================
-- FOLDER STRUCTURE
-- ============================================

/*
Images are organized by store ID:

products/
├── {store-uuid-1}/
│   ├── 1234567890_abc123.jpg
│   ├── 1234567891_def456.png
│   └── ...
├── {store-uuid-2}/
│   └── ...
└── ...

services/
├── {store-uuid-1}/
│   ├── 1234567890_xyz789.jpg
│   └── ...
├── {store-uuid-2}/
│   └── ...
└── ...

This structure ensures:
- Easy identification of which store owns which images
- Clean separation between different vendors
- Easy bulk operations per store
- Automatic organization
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

/*
After applying policies, verify they work:

-- Check if policies exist for products bucket
SELECT * FROM storage.policies 
WHERE bucket_id = 'products';

-- Check if policies exist for services bucket
SELECT * FROM storage.policies 
WHERE bucket_id = 'services';

-- Expected: 4 policies per bucket (INSERT, UPDATE, DELETE, SELECT)
*/
