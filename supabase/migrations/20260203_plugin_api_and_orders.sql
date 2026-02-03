-- ============================================
-- Plugin API: integrations and plugin order type
-- ============================================

-- Enable pgcrypto for API key hashing in RPC
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Plugin integrations: one per store; API key for external platforms to create orders
CREATE TABLE IF NOT EXISTS public.plugin_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  api_key_prefix TEXT NOT NULL,
  fee_per_order NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (fee_per_order >= 0),
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id)
);

CREATE INDEX IF NOT EXISTS idx_plugin_integrations_store_id ON public.plugin_integrations(store_id);
CREATE INDEX IF NOT EXISTS idx_plugin_integrations_vendor_id ON public.plugin_integrations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_plugin_integrations_api_key_hash ON public.plugin_integrations(api_key_hash);

ALTER TABLE public.plugin_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plugin_integrations"
  ON public.plugin_integrations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Service/anon will use RPC to validate API key; no direct SELECT for anon
COMMENT ON TABLE public.plugin_integrations IS 'Plugin API integrations: store, API key hash, fee per order. Used by external platforms to create gift orders.';

-- Orders: add plugin order type and plugin-related columns
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_type_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('self', 'gift', 'plugin'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS plugin_integration_id UUID REFERENCES public.plugin_integrations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_order_id TEXT,
  ADD COLUMN IF NOT EXISTS plugin_fee NUMERIC(10, 2) DEFAULT 0 CHECK (plugin_fee >= 0);

CREATE INDEX IF NOT EXISTS idx_orders_plugin_integration_id ON public.orders(plugin_integration_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_external_order_plugin ON public.orders(plugin_integration_id, external_order_id)
  WHERE plugin_integration_id IS NOT NULL AND external_order_id IS NOT NULL;

COMMENT ON COLUMN public.orders.plugin_integration_id IS 'Set for plugin orders: which integration created this order';
COMMENT ON COLUMN public.orders.external_order_id IS 'External platform order ID (for plugin orders)';
COMMENT ON COLUMN public.orders.plugin_fee IS 'Fee charged to seller for this plugin order';

-- RPC: validate API key and return integration (used by plugin API routes)
CREATE OR REPLACE FUNCTION public.get_plugin_integration_by_api_key(api_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF api_key IS NULL OR length(trim(api_key)) < 16 THEN
    RETURN NULL;
  END IF;
  SELECT jsonb_build_object(
    'id', id,
    'store_id', store_id,
    'vendor_id', vendor_id,
    'fee_per_order', fee_per_order,
    'name', name
  ) INTO result
  FROM public.plugin_integrations
  WHERE is_active = true
    AND api_key_hash = encode(digest(trim(api_key), 'sha256'), 'hex');
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_plugin_integration_by_api_key(text) IS 'Validates plugin API key and returns integration (id, store_id, vendor_id, fee_per_order, name). Returns NULL if invalid.';

GRANT EXECUTE ON FUNCTION public.get_plugin_integration_by_api_key(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_plugin_integration_by_api_key(text) TO authenticated;

-- Trigger updated_at for plugin_integrations
CREATE TRIGGER update_plugin_integrations_updated_at
  BEFORE UPDATE ON public.plugin_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC: insert vendor_order for a plugin order (only if order is plugin and integration matches)
CREATE OR REPLACE FUNCTION public.insert_vendor_order_for_plugin(
  p_order_id uuid,
  p_vendor_id uuid,
  p_store_id uuid,
  p_plugin_integration_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  integ_store_id uuid;
  integ_vendor_id uuid;
BEGIN
  IF p_order_id IS NULL OR p_vendor_id IS NULL OR p_store_id IS NULL OR p_plugin_integration_id IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters';
  END IF;
  SELECT pi.store_id, pi.vendor_id
    INTO integ_store_id, integ_vendor_id
  FROM public.plugin_integrations pi
  WHERE pi.id = p_plugin_integration_id AND pi.is_active = true;
  IF integ_store_id IS NULL OR integ_store_id != p_store_id OR integ_vendor_id != p_vendor_id THEN
    RAISE EXCEPTION 'Invalid plugin integration or store/vendor mismatch';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND plugin_integration_id = p_plugin_integration_id) THEN
    RAISE EXCEPTION 'Order not found or not a plugin order for this integration';
  END IF;
  INSERT INTO public.vendor_orders (order_id, vendor_id, store_id, status)
  VALUES (p_order_id, p_vendor_id, p_store_id, 'pending')
  ON CONFLICT (order_id, vendor_id) DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END;
$$;

COMMENT ON FUNCTION public.insert_vendor_order_for_plugin(uuid, uuid, uuid, uuid) IS 'Inserts vendor_order for a plugin order. Only allowed when order belongs to the given plugin integration and store/vendor match.';

GRANT EXECUTE ON FUNCTION public.insert_vendor_order_for_plugin(uuid, uuid, uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_vendor_order_for_plugin(uuid, uuid, uuid, uuid) TO authenticated;

-- RPC: get plugin order by id or external_order_id (validates API key)
CREATE OR REPLACE FUNCTION public.get_plugin_order(api_key text, p_order_id uuid DEFAULT NULL, p_external_order_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  integ_id uuid;
  result jsonb;
BEGIN
  IF p_order_id IS NULL AND (p_external_order_id IS NULL OR trim(p_external_order_id) = '') THEN
    RETURN NULL;
  END IF;
  SELECT id INTO integ_id FROM public.plugin_integrations
  WHERE is_active = true AND api_key_hash = encode(digest(trim(api_key), 'sha256'), 'hex');
  IF integ_id IS NULL THEN
    RETURN NULL;
  END IF;
  IF p_order_id IS NOT NULL THEN
    SELECT to_jsonb(o) || jsonb_build_object('order_items', (
      SELECT coalesce(jsonb_agg(to_jsonb(oi)), '[]'::jsonb) FROM public.order_items oi WHERE oi.order_id = o.id
    )) INTO result
    FROM public.orders o
    WHERE o.id = p_order_id AND o.plugin_integration_id = integ_id;
  ELSE
    SELECT to_jsonb(o) || jsonb_build_object('order_items', (
      SELECT coalesce(jsonb_agg(to_jsonb(oi)), '[]'::jsonb) FROM public.order_items oi WHERE oi.order_id = o.id
    )) INTO result
    FROM public.orders o
    WHERE o.external_order_id = trim(p_external_order_id) AND o.plugin_integration_id = integ_id;
  END IF;
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_plugin_order(text, uuid, text) IS 'Returns plugin order by id or external_order_id if API key matches order integration.';

GRANT EXECUTE ON FUNCTION public.get_plugin_order(text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_plugin_order(text, uuid, text) TO authenticated;
