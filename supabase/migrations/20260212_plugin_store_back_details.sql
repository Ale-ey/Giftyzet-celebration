-- Store back details for plugin orders: external store name, phone, address.
-- Super admin uses these on the dashboard to see who the order came from and process payments.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS plugin_store_name TEXT,
  ADD COLUMN IF NOT EXISTS plugin_store_phone TEXT,
  ADD COLUMN IF NOT EXISTS plugin_store_address TEXT;

COMMENT ON COLUMN public.orders.plugin_store_name IS 'External store business name (plugin orders). Shown to admin for payment reconciliation.';
COMMENT ON COLUMN public.orders.plugin_store_phone IS 'External store contact phone (plugin orders).';
COMMENT ON COLUMN public.orders.plugin_store_address IS 'External store address (plugin orders).';
