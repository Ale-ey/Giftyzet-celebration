-- RPC: get order + order_items by gift_token (for recipient page; works for anon)
CREATE OR REPLACE FUNCTION public.get_order_by_gift_token(p_gift_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_gift_token IS NULL OR trim(p_gift_token) = '' THEN
    RETURN NULL;
  END IF;
  SELECT to_jsonb(o) || jsonb_build_object('order_items', (
    SELECT coalesce(jsonb_agg(to_jsonb(oi)), '[]'::jsonb) FROM public.order_items oi WHERE oi.order_id = o.id
  )) INTO result
  FROM public.orders o
  WHERE o.gift_token = trim(p_gift_token);
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_order_by_gift_token(text) IS 'Returns order and order_items by gift_token for recipient address page. Used by anon.';

GRANT EXECUTE ON FUNCTION public.get_order_by_gift_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_by_gift_token(text) TO authenticated;

-- RPC: confirm gift receiver address and contact details (for recipient page; works for anon)
-- p_receiver_address required; p_receiver_name, p_receiver_email, p_receiver_phone optional (update if provided)
CREATE OR REPLACE FUNCTION public.confirm_gift_receiver(
  p_gift_token text,
  p_receiver_address text,
  p_receiver_name text DEFAULT NULL,
  p_receiver_email text DEFAULT NULL,
  p_receiver_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_id uuid;
  order_row public.orders%ROWTYPE;
  v_name text;
  v_email text;
  v_phone text;
BEGIN
  IF p_gift_token IS NULL OR trim(p_gift_token) = '' OR p_receiver_address IS NULL OR trim(p_receiver_address) = '' THEN
    RAISE EXCEPTION 'gift_token and receiver_address are required';
  END IF;
  SELECT id INTO order_id FROM public.orders WHERE gift_token = trim(p_gift_token);
  IF order_id IS NULL THEN
    RAISE EXCEPTION 'Gift not found';
  END IF;
  v_name := NULLIF(trim(p_receiver_name), '');
  v_email := NULLIF(trim(p_receiver_email), '');
  v_phone := NULLIF(trim(p_receiver_phone), '');
  UPDATE public.orders
  SET
    receiver_address = trim(p_receiver_address),
    receiver_name = COALESCE(v_name, receiver_name),
    receiver_email = COALESCE(v_email, receiver_email),
    receiver_phone = COALESCE(v_phone, receiver_phone),
    status = 'confirmed',
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = order_id;
  UPDATE public.vendor_orders SET status = 'confirmed', updated_at = NOW() WHERE order_id = order_id;
  SELECT * INTO order_row FROM public.orders WHERE id = order_id;
  RETURN to_jsonb(order_row);
END;
$$;

COMMENT ON FUNCTION public.confirm_gift_receiver(text, text, text, text, text) IS 'Confirms gift receiver address and optional contact details (name, email, phone) by gift_token. Used by recipient page (anon).';

GRANT EXECUTE ON FUNCTION public.confirm_gift_receiver(text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_gift_receiver(text, text, text, text, text) TO authenticated;
