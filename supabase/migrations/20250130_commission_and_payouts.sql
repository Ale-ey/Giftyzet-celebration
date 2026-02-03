-- ============================================
-- Platform commission and vendor payouts
-- ============================================

-- Platform settings (single row: commission %)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (id, commission_percent)
VALUES ('default', 10.00)
ON CONFLICT (id) DO NOTHING;

-- Stores: Stripe Connect account for receiving payouts
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.stores.stripe_account_id IS 'Stripe Connect Express account ID for receiving payouts';
COMMENT ON COLUMN public.stores.stripe_onboarding_complete IS 'True after vendor completed Stripe Connect onboarding';

-- Vendor orders: delivered_at and payout tracking
ALTER TABLE public.vendor_orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'failed')),
  ADD COLUMN IF NOT EXISTS payout_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS vendor_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

COMMENT ON COLUMN public.vendor_orders.delivered_at IS 'Set when status is updated to delivered';
COMMENT ON COLUMN public.vendor_orders.payout_status IS 'pending = not yet paid, paid = transferred to vendor';
COMMENT ON COLUMN public.vendor_orders.commission_amount IS 'Platform commission deducted from this vendor order';
COMMENT ON COLUMN public.vendor_orders.vendor_amount IS 'Amount transferred to vendor (after commission)';

-- RLS for platform_settings (only admin can read/update)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow read for commission display (API uses anon client for GET)
CREATE POLICY "Allow read platform_settings"
  ON public.platform_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin update platform_settings"
  ON public.platform_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role / anon might need for API; if API uses service role key it bypasses RLS
-- Ensure stores and vendor_orders remain accessible per existing policies
