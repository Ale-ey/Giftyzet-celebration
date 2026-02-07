-- ============================================
-- Stores RLS: allow vendors to create/update own stores and see pending ones
-- Fixes "new row violates row-level security policy for table stores"
-- ============================================

-- Ensure RLS is on
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Replace SELECT so vendors can see their own stores (pending/approved)
DROP POLICY IF EXISTS "Anyone can view approved stores" ON public.stores;
CREATE POLICY "Anyone can view approved stores"
ON public.stores
FOR SELECT
TO public
USING (
  status = 'approved'
  OR vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- Allow vendors to INSERT a store for their own vendor_id
DROP POLICY IF EXISTS "Vendors can create own stores" ON public.stores;
CREATE POLICY "Vendors can create own stores"
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);

-- Allow vendors to UPDATE their own stores
DROP POLICY IF EXISTS "Vendors can update own stores" ON public.stores;
CREATE POLICY "Vendors can update own stores"
ON public.stores
FOR UPDATE
TO authenticated
USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()))
WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));
