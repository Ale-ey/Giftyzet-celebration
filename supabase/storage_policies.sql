-- ============================================
-- Storage Bucket Policies Setup
-- Run this AFTER creating buckets in Supabase Dashboard
-- ============================================

-- Step 1: Create buckets first in Supabase Dashboard:
-- - avatars (Public, 5 MB limit)
-- - products (Public, 10 MB limit)
-- - services (Public, 10 MB limit)
-- - stores (Public, 10 MB limit)

-- Step 2: Run this script to create all policies

-- Policy 1: Public Read Access (All Buckets)
DROP POLICY IF EXISTS "Public can read files" ON storage.objects;
CREATE POLICY "Public can read files" ON storage.objects
FOR SELECT 
USING (bucket_id IN ('avatars', 'products', 'services', 'stores'));

-- Policy 2: Authenticated Users Can Upload (General)
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND
  (
    bucket_id = 'avatars' OR
    bucket_id = 'products' OR
    bucket_id = 'services' OR
    bucket_id = 'stores'
  )
);

-- Policy 3: Users Can Upload Own Avatars
-- Path format: {userId}/filename.jpg
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Vendors Can Upload Store Images
-- Path format: {storeId}/logo/filename.jpg or {storeId}/banner/filename.jpg
DROP POLICY IF EXISTS "Vendors can upload own store images" ON storage.objects;
CREATE POLICY "Vendors can upload own store images" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'stores' AND
  auth.uid() IN (
    SELECT user_id FROM public.vendors v
    JOIN public.stores s ON s.vendor_id = v.id
    WHERE s.id::text = (storage.foldername(name))[1]
  )
);

-- Policy 5: Users Can Delete Own Avatars
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 6: Vendors Can Delete Own Store/Product/Service Images
DROP POLICY IF EXISTS "Vendors can delete own images" ON storage.objects;
CREATE POLICY "Vendors can delete own images" ON storage.objects
FOR DELETE 
USING (
  bucket_id IN ('products', 'services', 'stores') AND
  auth.uid() IN (
    SELECT user_id FROM public.vendors v
    JOIN public.stores s ON s.vendor_id = v.id
    WHERE 
      -- For products/services: {productId}/filename or {serviceId}/filename
      s.id IN (
        SELECT store_id FROM public.products WHERE id::text = (storage.foldername(name))[1]
        UNION
        SELECT store_id FROM public.services WHERE id::text = (storage.foldername(name))[1]
      )
      OR
      -- For stores: {storeId}/logo/filename or {storeId}/banner/filename
      s.id::text = (storage.foldername(name))[1]
  )
);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

