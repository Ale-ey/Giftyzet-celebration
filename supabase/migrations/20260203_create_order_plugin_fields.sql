-- Extend create_order RPC to support plugin orders (plugin_integration_id, external_order_id, plugin_fee, payment_status)
CREATE OR REPLACE FUNCTION public.create_order(order_data jsonb, items_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  new_order_id uuid;
  order_row public.orders%ROWTYPE;
  item jsonb;
BEGIN
  INSERT INTO public.orders (
    order_number, user_id, order_type,
    sender_name, sender_email, sender_phone, sender_address,
    receiver_name, receiver_email, receiver_phone, receiver_address,
    shipping_address, subtotal, shipping, tax, total,
    gift_token, gift_link, status,
    plugin_integration_id, external_order_id, plugin_fee,
    payment_status
  ) VALUES (
    order_data->>'order_number',
    NULLIF(order_data->>'user_id', '')::uuid,
    COALESCE(order_data->>'order_type', 'self'),
    order_data->>'sender_name',
    order_data->>'sender_email',
    order_data->>'sender_phone',
    order_data->>'sender_address',
    NULLIF(TRIM(order_data->>'receiver_name'), ''),
    NULLIF(TRIM(order_data->>'receiver_email'), ''),
    NULLIF(TRIM(order_data->>'receiver_phone'), ''),
    NULLIF(TRIM(order_data->>'receiver_address'), ''),
    NULLIF(TRIM(order_data->>'shipping_address'), ''),
    (order_data->>'subtotal')::numeric,
    COALESCE((order_data->>'shipping')::numeric, 0),
    COALESCE((order_data->>'tax')::numeric, 0),
    (order_data->>'total')::numeric,
    NULLIF(TRIM(order_data->>'gift_token'), ''),
    NULLIF(TRIM(order_data->>'gift_link'), ''),
    COALESCE(order_data->>'status', 'pending'),
    NULLIF(TRIM(order_data->>'plugin_integration_id'), '')::uuid,
    NULLIF(TRIM(order_data->>'external_order_id'), ''),
    COALESCE((order_data->>'plugin_fee')::numeric, 0),
    COALESCE(order_data->>'payment_status', 'pending')
  )
  RETURNING id INTO new_order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(items_data)
  LOOP
    INSERT INTO public.order_items (order_id, item_type, product_id, service_id, name, price, quantity, image_url)
    VALUES (
      new_order_id,
      COALESCE(item->>'item_type', 'product'),
      NULLIF(TRIM(item->>'product_id'), '')::uuid,
      NULLIF(TRIM(item->>'service_id'), '')::uuid,
      item->>'name',
      (item->>'price')::numeric,
      GREATEST(COALESCE((item->>'quantity')::int, 1), 1),
      NULLIF(TRIM(item->>'image_url'), '')
    );
  END LOOP;

  SELECT * INTO order_row FROM public.orders WHERE id = new_order_id;
  RETURN to_jsonb(order_row);
END;
$$;

COMMENT ON FUNCTION public.create_order(jsonb, jsonb) IS 'Creates order and order_items. Supports plugin orders (plugin_integration_id, external_order_id, plugin_fee, payment_status). Trigger decreases product stock for items with product_id.';
