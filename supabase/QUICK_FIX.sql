-- ============================================
-- QUICK FIX: RLS Policies, Trigger for Signup, and Recursion Fix
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Fix RLS Recursion Issue
-- Create helper function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check role from users table (with LIMIT to avoid full scan)
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update users SELECT policy to use is_admin()
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Update other policies that check admin role
DROP POLICY IF EXISTS "Vendors can view own profile" ON public.vendors;
CREATE POLICY "Vendors can view own profile" ON public.vendors
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can view approved stores" ON public.stores;
CREATE POLICY "Anyone can view approved stores" ON public.stores
  FOR SELECT USING (status = 'approved' OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can view products from approved stores" ON public.products;
CREATE POLICY "Anyone can view products from approved stores" ON public.products
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE status = 'approved') 
    OR store_id IN (SELECT id FROM public.stores WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())) 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Anyone can view services from approved stores" ON public.services;
CREATE POLICY "Anyone can view services from approved stores" ON public.services
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE status = 'approved') 
    OR store_id IN (SELECT id FROM public.stores WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())) 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    user_id = auth.uid() 
    OR id IN (SELECT order_id FROM public.vendor_orders WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())) 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can view order items for own orders" ON public.order_items;
CREATE POLICY "Users can view order items for own orders" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE user_id = auth.uid() 
      OR id IN (SELECT order_id FROM public.vendor_orders WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()))
    ) 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Vendors can view own vendor orders" ON public.vendor_orders;
CREATE POLICY "Vendors can view own vendor orders" ON public.vendor_orders
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) 
    OR public.is_admin()
  );

-- ============================================
-- Step 2: RLS Policies and Trigger for Signup
-- ============================================

-- 1. Add INSERT policy for users table
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2. Add INSERT policy for vendors table
DROP POLICY IF EXISTS "Vendors can insert own profile" ON public.vendors;
CREATE POLICY "Vendors can insert own profile" ON public.vendors
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- 3. Create trigger function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    role = COALESCE(EXCLUDED.role, users.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify it worked
SELECT 'is_admin function created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name = 'is_admin'
);

SELECT 'Policy created' as status WHERE EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE tablename = 'users' 
  AND policyname = 'Users can insert own profile'
);

SELECT 'Trigger created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created'
);

-- ============================================
-- Step 3: Vendor Signup Trigger (for email confirmation)
-- ============================================

-- Function to handle vendor creation after email confirmation
CREATE OR REPLACE FUNCTION public.handle_vendor_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  vendor_name TEXT;
BEGIN
  -- Get user role from metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Only proceed if user is a vendor
  IF user_role = 'vendor' THEN
    -- Get vendor name from metadata or email
    vendor_name := COALESCE(
      NEW.raw_user_meta_data->>'vendor_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    );
    
    -- Check if vendor already exists
    IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE user_id = NEW.id) THEN
      -- Create vendor profile
      INSERT INTO public.vendors (
        user_id,
        vendor_name,
        business_name,
        email,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        vendor_name,
        vendor_name,
        NEW.email,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO NOTHING;
      
      -- Create store with pending status
      INSERT INTO public.stores (
        vendor_id,
        name,
        description,
        email,
        status,
        created_at,
        updated_at
      )
      SELECT 
        v.id,
        vendor_name,
        'Store for ' || vendor_name,
        NEW.email,
        'pending',
        NOW(),
        NOW()
      FROM public.vendors v
      WHERE v.user_id = NEW.id
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on email confirmation (when email_confirmed_at is set)
-- We'll use the handle_vendor_signup function directly in the trigger
-- Create trigger on auth.users update
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_vendor_signup();
