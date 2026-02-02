-- Decrease product stock when order_items are inserted (products only; services have no stock).
-- Trigger runs with SECURITY DEFINER so it can update products (RLS blocks anon/vendor from updating other stores' products).
-- If insufficient stock, the trigger raises and the insert is rolled back.

CREATE OR REPLACE FUNCTION public.decrease_product_stock_on_order_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count int;
BEGIN
  IF NEW.product_id IS NOT NULL AND NEW.quantity IS NOT NULL AND NEW.quantity > 0 THEN
    UPDATE public.products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id AND stock >= NEW.quantity;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count = 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_order_item_insert_decrease_stock ON public.order_items;
CREATE TRIGGER after_order_item_insert_decrease_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.decrease_product_stock_on_order_item();

COMMENT ON FUNCTION public.decrease_product_stock_on_order_item() IS 'Trigger: decrease products.stock by order_items.quantity when a product order item is inserted. Raises if stock would go negative.';

-- RPC: create order + order_items in one transaction so that if stock trigger raises, whole transaction rolls back.
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
    gift_token, gift_link, status
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
    COALESCE(order_data->>'status', 'pending')
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

COMMENT ON FUNCTION public.create_order(jsonb, jsonb) IS 'Creates order and order_items in one transaction. Trigger decreases product stock; on insufficient stock the whole transaction rolls back.';

-- Allow anon and authenticated to call create_order (for checkout)
GRANT EXECUTE ON FUNCTION public.create_order(jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_order(jsonb, jsonb) TO authenticated;
