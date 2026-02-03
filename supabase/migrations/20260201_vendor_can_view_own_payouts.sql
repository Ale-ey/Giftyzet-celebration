-- Vendors can view their own payout history (for vendor dashboard payouts section)
DROP POLICY IF EXISTS "Vendors can view own payouts" ON public.vendor_payouts;
CREATE POLICY "Vendors can view own payouts" ON public.vendor_payouts
  FOR SELECT TO authenticated
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );
