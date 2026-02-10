-- RPC: Reject gift by token (recipient declines). Sets order and vendor_orders to cancelled.
CREATE OR REPLACE FUNCTION public.reject_gift_receiver(p_gift_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  order_row public.orders%ROWTYPE;
BEGIN
  IF p_gift_token IS NULL OR trim(p_gift_token) = '' THEN
    RAISE EXCEPTION 'gift_token is required';
  END IF;
  SELECT id INTO v_order_id FROM public.orders WHERE gift_token = trim(p_gift_token);
  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Gift not found';
  END IF;
  UPDATE public.orders
  SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
  WHERE id = v_order_id;
  UPDATE public.vendor_orders SET status = 'cancelled', updated_at = NOW() WHERE order_id = v_order_id;
  SELECT * INTO order_row FROM public.orders WHERE id = v_order_id;
  RETURN to_jsonb(order_row);
END;
$$;

COMMENT ON FUNCTION public.reject_gift_receiver(text) IS 'Rejects/declines a gift by gift_token. Sets order and vendor_orders to cancelled. Used by recipient page (anon).';

GRANT EXECUTE ON FUNCTION public.reject_gift_receiver(text) TO anon;
GRANT EXECUTE ON FUNCTION public.reject_gift_receiver(text) TO authenticated;
