-- ============================================
-- Admin Policies for Store Management
-- ============================================

-- Drop existing policies if needed
DROP POLICY IF EXISTS "Admins can update any store" ON public.stores;

-- Allow admins to update stores (approve, suspend, reject)
CREATE POLICY "Admins can update any store" ON public.stores
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow admins to view all stores regardless of status
DROP POLICY IF EXISTS "Anyone can view approved stores" ON public.stores;

CREATE POLICY "Anyone can view stores" ON public.stores
  FOR SELECT USING (
    status = 'approved' OR 
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) OR 
    public.is_admin()
  );

-- Grant admins ability to view all vendors
CREATE POLICY "Admins can view all vendors" ON public.vendors
  FOR SELECT USING (public.is_admin() OR user_id = auth.uid());

-- ============================================
-- Verify Admin Function Works
-- ============================================
-- The is_admin() function should already exist in schema.sql
-- If not, uncomment below:

/*
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
*/

