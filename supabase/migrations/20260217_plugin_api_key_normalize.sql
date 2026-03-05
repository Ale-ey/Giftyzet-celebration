-- Normalize API key in RPC: strip CR/LF and trim so keys sent with newlines match.
CREATE OR REPLACE FUNCTION public.get_plugin_integration_by_api_key(api_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  p_trimmed text := trim(regexp_replace(trim(coalesce(api_key, '')), E'[\\r\\n]+', '', 'g'));
  p_normalized text := regexp_replace(p_trimmed, '\\s+', ' ', 'g');
BEGIN
  IF length(p_normalized) < 16 THEN
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
      api_key_hash = encode(digest(p_normalized, 'sha256'), 'hex')
      OR api_key_plain = p_normalized
      OR api_key_plain = trim(coalesce(api_key, ''))
    )
  LIMIT 1;
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_plugin_integration_by_api_key(text) IS 'Validates plugin API key (by hash or plain). Key is normalized: trim, strip CR/LF, collapse spaces.';
