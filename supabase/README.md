# Supabase Setup Guide

This guide will help you set up Supabase for the Giftyzel application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project

## Setup Steps

### 1. Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project details:
   - Name: `giftyzel` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

### 2. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify all tables, functions, triggers, and policies were created successfully

### 3. Create Storage Buckets

Navigate to **Storage** in the left sidebar and create the following buckets:

#### Bucket: `avatars`
- Public bucket: **Yes**
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

#### Bucket: `products`
- Public bucket: **Yes**
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

#### Bucket: `services`
- Public bucket: **Yes**
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

#### Bucket: `stores`
- Public bucket: **Yes**
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

### 4. Configure Storage Policies

For each bucket, add the following policies:

#### Upload Policy (for authenticated users)
```sql
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  OR bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]
  OR bucket_id = 'services' AND auth.uid()::text = (storage.foldername(name))[1]
  OR bucket_id = 'stores' AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Read Policy (public)
```sql
CREATE POLICY "Public can read files" ON storage.objects
FOR SELECT USING (bucket_id IN ('avatars', 'products', 'services', 'stores'));
```

#### Delete Policy (for file owners)
```sql
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  OR bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]
  OR bucket_id = 'services' AND auth.uid()::text = (storage.foldername(name))[1]
  OR bucket_id = 'stores' AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 5. Get API Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 6. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Important:** Never commit `.env.local` to version control. Add it to `.gitignore`.

### 7. Install Supabase Client

The Supabase client is already configured in `lib/supabase/client.ts`. Make sure you have the package installed:

```bash
npm install @supabase/supabase-js
```

### 8. Test the Connection

You can test the connection by checking if the Supabase client initializes correctly:

```typescript
import { supabase } from '@/lib/supabase/client'

// Test connection
const { data, error } = await supabase.from('users').select('count')
console.log('Connection test:', { data, error })
```

## Database Schema Overview

The schema includes the following main tables:

- **users** - User profiles (extends Supabase auth.users)
- **vendors** - Vendor business information
- **stores** - Store details (status: pending/approved/suspended)
- **products** - Product listings
- **services** - Service listings
- **orders** - Customer orders (supports self and gift orders)
- **order_items** - Items in each order
- **vendor_orders** - Vendor-specific order assignments
- **reviews** - Product/service reviews
- **wishlists** - User wishlists
- **wishlist_items** - Items in wishlists
- **carts** - Shopping carts (for logged-in users)

## Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow users to manage their own data
- Allow vendors to manage their stores/products/services
- Allow admins to view/manage all data
- Allow public access to approved stores and products

## Key Features

1. **Authentication**: Uses Supabase Auth for user registration/login
2. **Storage**: Uses Supabase Storage for images (avatars, products, services, stores)
3. **Real-time**: Can enable real-time subscriptions for orders, products, etc.
4. **Security**: RLS policies ensure data isolation and security

## Next Steps

1. Set up email templates in Supabase Auth settings
2. Configure OAuth providers if needed (Google, GitHub, etc.)
3. Set up webhooks for order processing (optional)
4. Configure backup schedules
5. Set up monitoring and alerts

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure you're authenticated when testing authenticated endpoints
2. **Storage Upload Errors**: Verify bucket policies and file size limits
3. **Foreign Key Errors**: Ensure related records exist before creating dependent records
4. **Permission Errors**: Check that RLS policies allow the operation

### Useful Queries

```sql
-- Check all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- View storage buckets
SELECT * FROM storage.buckets;
```

## Support

For Supabase-specific issues, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

