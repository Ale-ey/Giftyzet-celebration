-- Allow API key validation by hash OR by plain key (fixes mismatch e.g. encoding).
-- Keeps hash as primary; api_key_plain fallback so keys always validate.
CREATE OR REPLACE FUNCTION public.get_plugin_integration_by_api_key(api_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  p_trimmed text := trim(api_key);
BEGIN
  IF api_key IS NULL OR length(p_trimmed) < 16 THEN
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
    AND (
      api_key_hash = encode(digest(p_trimmed, 'sha256'), 'hex')
      OR api_key_plain = p_trimmed
    )
  LIMIT 1;
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_plugin_integration_by_api_key(text) IS 'Validates plugin API key (by hash or plain) and returns integration.';

-- get_plugin_order also uses api_key_hash; add same fallback
CREATE OR REPLACE FUNCTION public.get_plugin_order(api_key text, p_order_id uuid DEFAULT NULL, p_external_order_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  integ_id uuid;
  result jsonb;
  p_trimmed text := trim(api_key);
BEGIN
  IF p_order_id IS NULL AND (p_external_order_id IS NULL OR trim(p_external_order_id) = '') THEN
    RETURN NULL;
  END IF;
  SELECT id INTO integ_id FROM public.plugin_integrations
  WHERE is_active = true
    AND (api_key_hash = encode(digest(p_trimmed, 'sha256'), 'hex') OR api_key_plain = p_trimmed)
  LIMIT 1;
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

COMMENT ON FUNCTION public.get_plugin_order(text, uuid, text) IS 'Returns plugin order by id or external_order_id if API key matches (hash or plain).';

GRANT EXECUTE ON FUNCTION public.get_plugin_integration_by_api_key(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_plugin_integration_by_api_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_plugin_order(text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_plugin_order(text, uuid, text) TO authenticated;
