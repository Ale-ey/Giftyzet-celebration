-- ============================================
-- Fix RLS Policies for Users Table
-- This fixes the "new row violates row-level security policy" error on signup
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Vendors can insert own profile" ON public.vendors;

-- Allow users to insert their own profile during signup
-- This policy allows authenticated users to create their profile with their own user ID
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow vendors to insert their own vendor profile during vendor signup
CREATE POLICY "Vendors can insert own profile" ON public.vendors
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE (tablename = 'users' AND policyname = 'Users can insert own profile')
   OR (tablename = 'vendors' AND policyname = 'Vendors can insert own profile')
ORDER BY tablename, policyname;

