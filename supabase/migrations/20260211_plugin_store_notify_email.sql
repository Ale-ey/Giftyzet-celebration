-- Store owner email for plugin orders: used to send "order created" and "receiver confirmed" emails.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS plugin_store_notify_email TEXT;

COMMENT ON COLUMN public.orders.plugin_store_notify_email IS 'Email to notify when plugin order is created and when receiver confirms (gift link).';
