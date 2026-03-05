-- Store bank / payout details for plugin orders. Admin uses these for manual transfers.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS plugin_store_bank_name TEXT,
  ADD COLUMN IF NOT EXISTS plugin_store_account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS plugin_store_account_number TEXT,
  ADD COLUMN IF NOT EXISTS plugin_store_routing_number TEXT,
  ADD COLUMN IF NOT EXISTS plugin_store_iban TEXT,
  ADD COLUMN IF NOT EXISTS plugin_store_swift_bic TEXT,
  ADD COLUMN IF NOT EXISTS plugin_store_stripe_account_id TEXT;

COMMENT ON COLUMN public.orders.plugin_store_bank_name IS 'Store bank name (plugin). For admin manual payouts.';
COMMENT ON COLUMN public.orders.plugin_store_account_holder_name IS 'Bank account holder name (plugin).';
COMMENT ON COLUMN public.orders.plugin_store_account_number IS 'Bank account number (plugin). Sensitive – admin only.';
COMMENT ON COLUMN public.orders.plugin_store_routing_number IS 'US routing number (plugin).';
COMMENT ON COLUMN public.orders.plugin_store_iban IS 'IBAN for international (plugin).';
COMMENT ON COLUMN public.orders.plugin_store_swift_bic IS 'SWIFT/BIC for international (plugin).';
COMMENT ON COLUMN public.orders.plugin_store_stripe_account_id IS 'Stripe Connect account ID (acct_*) for payouts (plugin).';
