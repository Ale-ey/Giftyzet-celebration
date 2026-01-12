-- ============================================
-- Fix RLS Infinite Recursion Issue
-- The problem: Policies checking users table cause recursion
-- Solution: Use a helper function or check auth.jwt() directly
-- ============================================

-- Step 1: Create a helper function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check role from auth metadata or users table (with recursion protection)
  -- First try to get from jwt claims
  IF (auth.jwt() ->> 'user_role') = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: Check users table but only if not already checking
  -- Use a different approach - check if user exists and has admin role
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 2: Drop and recreate users SELECT policy without recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

-- Step 3: Fix all other policies that check users.role
-- Vendors SELECT policy
DROP POLICY IF EXISTS "Vendors can view own profile" ON public.vendors;
CREATE POLICY "Vendors can view own profile" ON public.vendors
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Stores SELECT policy
DROP POLICY IF EXISTS "Anyone can view approved stores" ON public.stores;
CREATE POLICY "Anyone can view approved stores" ON public.stores
  FOR SELECT USING (
    status = 'approved' 
    OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) 
    OR public.is_admin()
  );

-- Products SELECT policy
DROP POLICY IF EXISTS "Anyone can view products from approved stores" ON public.products;
CREATE POLICY "Anyone can view products from approved stores" ON public.products
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE status = 'approved') 
    OR store_id IN (SELECT id FROM public.stores WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())) 
    OR public.is_admin()
  );

-- Services SELECT policy
DROP POLICY IF EXISTS "Anyone can view services from approved stores" ON public.services;
CREATE POLICY "Anyone can view services from approved stores" ON public.services
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE status = 'approved') 
    OR store_id IN (SELECT id FROM public.stores WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())) 
    OR public.is_admin()
  );

-- Orders SELECT policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    user_id = auth.uid() 
    OR id IN (SELECT order_id FROM public.vendor_orders WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())) 
    OR public.is_admin()
  );

-- Orders UPDATE policy
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- Order Items SELECT policy
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

-- Vendor Orders SELECT policy
DROP POLICY IF EXISTS "Vendors can view own vendor orders" ON public.vendor_orders;
CREATE POLICY "Vendors can view own vendor orders" ON public.vendor_orders
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) 
    OR public.is_admin()
  );

-- Verify the function was created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'is_admin';

