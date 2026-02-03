-- ============================================
-- Admin: is_admin() and allow admins to SELECT any store (for store detail page)
-- ============================================

-- So admins can read pending/rejected stores without RLS blocking (avoids recursion on users)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
    LIMIT 1
  );
END;
$$;

-- Allow admins to SELECT any store (pending, approved, suspended, rejected)
DROP POLICY IF EXISTS "Anyone can view approved stores" ON public.stores;
CREATE POLICY "Anyone can view approved stores"
ON public.stores
FOR SELECT
TO public
USING (
  status = 'approved'
  OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  OR public.is_admin()
);
