-- Vendor payouts: audit/history table linked to orders (vendor_orders)
-- One row per payout when admin pays a delivered vendor order
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_order_id UUID NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_total NUMERIC(12, 2) NOT NULL,
  commission_amount NUMERIC(12, 2) NOT NULL,
  vendor_amount NUMERIC(12, 2) NOT NULL,
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_order_id ON public.vendor_payouts(vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_order_id ON public.vendor_payouts(order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON public.vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_paid_at ON public.vendor_payouts(paid_at);

ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

-- Only admins can read vendor_payouts
CREATE POLICY "Admins can view vendor_payouts"
  ON public.vendor_payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Only service/backend can insert (API uses admin token; admin can insert via API)
CREATE POLICY "Admins can insert vendor_payouts"
  ON public.vendor_payouts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.vendor_payouts IS 'Payout history: one row per paid vendor order (order_total, commission, vendor_amount, Stripe transfer).';
