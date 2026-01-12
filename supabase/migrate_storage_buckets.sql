-- ============================================
-- Migration: Update Storage Policies from product-images to products/services buckets
-- ============================================

-- This script migrates from single 'product-images' bucket to separate 'products' and 'services' buckets

-- ============================================
-- STEP 1: Drop old policies for product-images bucket
-- ============================================

DROP POLICY IF EXISTS "Vendors can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

DROP POLICY IF EXISTS "Vendors can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can delete service images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view service images" ON storage.objects;

-- ============================================
-- STEP 2: Create new policies for PRODUCTS bucket
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
-- STEP 3: Create new policies for SERVICES bucket
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
-- VERIFICATION
-- ============================================

-- Check policies for products bucket
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND qual LIKE '%products%';

-- Check policies for services bucket
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND qual LIKE '%services%';

-- Expected: 4 policies per bucket (INSERT, UPDATE, DELETE, SELECT)

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration complete! Policies updated from product-images to products/services buckets.';
END $$;


