# Supabase Storage Buckets Setup Guide

This document provides detailed instructions for creating and configuring all required storage buckets for the Giftyzel application.

## Required Buckets

### 1. **avatars** - User Profile Pictures
- **Purpose**: Store user profile avatars
- **Public**: ✅ Yes (public read access)
- **File Size Limit**: 5 MB
- **Allowed MIME Types**: 
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
- **Folder Structure**: `{userId}/filename.jpg`
- **Usage**: Profile page avatar uploads

### 2. **products** - Product Images
- **Purpose**: Store product images
- **Public**: ✅ Yes (public read access)
- **File Size Limit**: 10 MB
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
- **Folder Structure**: `{productId}/filename.jpg`
- **Usage**: Product images in marketplace and vendor product management

### 3. **services** - Service Images
- **Purpose**: Store service images
- **Public**: ✅ Yes (public read access)
- **File Size Limit**: 10 MB
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
- **Folder Structure**: `{serviceId}/filename.jpg`
- **Usage**: Service images in marketplace and vendor service management

### 4. **stores** - Store Logos and Banners
- **Purpose**: Store vendor store logos and banners
- **Public**: ✅ Yes (public read access)
- **File Size Limit**: 10 MB
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
- **Folder Structure**: 
  - `{storeId}/logo/filename.jpg`
  - `{storeId}/banner/filename.jpg`
- **Usage**: Store branding images

---

## Step-by-Step Setup Instructions

### Method 1: Using Supabase Dashboard (Recommended)

1. **Navigate to Storage**
   - Go to your Supabase project dashboard
   - Click **Storage** in the left sidebar

2. **Create Each Bucket**
   - Click **New bucket**
   - Fill in the details for each bucket:

#### Bucket: `avatars`
```
Name: avatars
Public bucket: ✅ Yes
File size limit: 5242880 (5 MB in bytes)
Allowed MIME types: image/jpeg,image/png,image/webp,image/gif
```

#### Bucket: `products`
```
Name: products
Public bucket: ✅ Yes
File size limit: 10485760 (10 MB in bytes)
Allowed MIME types: image/jpeg,image/png,image/webp,image/gif
```

#### Bucket: `services`
```
Name: services
Public bucket: ✅ Yes
File size limit: 10485760 (10 MB in bytes)
Allowed MIME types: image/jpeg,image/png,image/webp,image/gif
```

#### Bucket: `stores`
```
Name: stores
Public bucket: ✅ Yes
File size limit: 10485760 (10 MB in bytes)
Allowed MIME types: image/jpeg,image/png,image/webp,image/gif
```

3. **Configure Storage Policies**

After creating buckets, you need to set up Row Level Security (RLS) policies. Go to **Storage** → **Policies** and add the following:

---

## Storage Policies (RLS)

### Policy 1: Public Read Access (All Buckets)

**Policy Name**: `Public can read files`

```sql
CREATE POLICY "Public can read files" ON storage.objects
FOR SELECT 
USING (bucket_id IN ('avatars', 'products', 'services', 'stores'));
```

**Description**: Allows anyone to read/view files from all public buckets.

---

### Policy 2: Authenticated Users Can Upload

**Policy Name**: `Authenticated users can upload files`

```sql
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
```

**Description**: Allows authenticated users to upload files to any bucket.

---

### Policy 3: Users Can Upload Own Avatars

**Policy Name**: `Users can upload own avatars`

```sql
CREATE POLICY "Users can upload own avatars" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Description**: Users can only upload avatars to their own folder (`{userId}/filename`).

---

### Policy 4: Vendors Can Upload Own Products/Services

**Policy Name**: `Vendors can upload own product/service images`

```sql
CREATE POLICY "Vendors can upload own product/service images" ON storage.objects
FOR INSERT 
WITH CHECK (
  (
    bucket_id = 'products' OR
    bucket_id = 'services'
  ) AND
  auth.uid() IN (
    SELECT user_id FROM public.vendors v
    JOIN public.stores s ON s.vendor_id = v.id
    JOIN public.products p ON p.store_id = s.id
    WHERE p.id::text = (storage.foldername(name))[1]
    UNION
    SELECT user_id FROM public.vendors v
    JOIN public.stores s ON s.vendor_id = v.id
    JOIN public.services sv ON sv.store_id = s.id
    WHERE sv.id::text = (storage.foldername(name))[1]
  )
);
```

**Description**: Vendors can only upload images for products/services in their own stores.

---

### Policy 5: Vendors Can Upload Store Images

**Policy Name**: `Vendors can upload own store images`

```sql
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
```

**Description**: Vendors can only upload logos/banners for their own stores.

---

### Policy 6: Users Can Delete Own Files

**Policy Name**: `Users can delete own files`

```sql
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE 
USING (
  (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  ) OR
  (
    bucket_id IN ('products', 'services', 'stores') AND
    auth.uid() IN (
      SELECT user_id FROM public.vendors v
      JOIN public.stores s ON s.vendor_id = v.id
      WHERE s.id::text = (storage.foldername(name))[1]
        OR s.id::text = (storage.foldername(name))[2]
    )
  )
);
```

**Description**: Users can delete their own avatars, and vendors can delete their own product/service/store images.

---

## Quick Setup SQL Script

Run this script in Supabase SQL Editor to create all policies at once:

```sql
-- ============================================
-- Storage Bucket Policies Setup
-- Run this after creating buckets in Supabase Dashboard
-- ============================================

-- Policy 1: Public Read Access
DROP POLICY IF EXISTS "Public can read files" ON storage.objects;
CREATE POLICY "Public can read files" ON storage.objects
FOR SELECT 
USING (bucket_id IN ('avatars', 'products', 'services', 'stores'));

-- Policy 2: Authenticated Users Can Upload
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
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Vendors Can Upload Store Images
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

-- Policy 5: Users Can Delete Own Files
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE 
USING (
  (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  ) OR
  (
    bucket_id IN ('products', 'services', 'stores') AND
    auth.uid() IN (
      SELECT user_id FROM public.vendors v
      JOIN public.stores s ON s.vendor_id = v.id
      WHERE s.id::text = (storage.foldername(name))[1]
        OR s.id::text = (storage.foldername(name))[2]
    )
  )
);
```

---

## Verification Checklist

After setup, verify:

- [ ] All 4 buckets created (`avatars`, `products`, `services`, `stores`)
- [ ] All buckets set to **Public**
- [ ] File size limits configured correctly
- [ ] MIME types restricted to images only
- [ ] Storage policies created and enabled
- [ ] Test upload from profile page (avatar)
- [ ] Test upload from vendor product page
- [ ] Test public URL access

---

## Testing

### Test Avatar Upload
```typescript
import { uploadAvatar } from '@/lib/api/storage'

const file = // ... file input
const userId = 'user-id-here'
const url = await uploadAvatar(file, userId)
console.log('Avatar URL:', url)
```

### Test Product Image Upload
```typescript
import { uploadProductImage } from '@/lib/api/storage'

const file = // ... file input
const productId = 'product-id-here'
const url = await uploadProductImage(file, productId)
console.log('Product Image URL:', url)
```

---

## Troubleshooting

### Issue: "new row violates row-level security policy"
**Solution**: Make sure storage policies are created and RLS is enabled on `storage.objects` table.

### Issue: "Bucket not found"
**Solution**: Verify bucket names match exactly (`avatars`, `products`, `services`, `stores` - lowercase, no spaces).

### Issue: "File too large"
**Solution**: Check file size limits in bucket settings. Default limits:
- Avatars: 5 MB
- Products/Services/Stores: 10 MB

### Issue: "Invalid MIME type"
**Solution**: Ensure file is one of: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.

---

## Notes

- All buckets are **public** for read access, but upload/delete requires authentication
- File paths are organized by user/vendor ID for better organization
- Images are automatically assigned unique filenames to prevent conflicts
- Public URLs are generated automatically and can be used directly in `<img>` tags

