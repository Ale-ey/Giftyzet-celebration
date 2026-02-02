-- Optional: add order_item_id to reviews so one review per line item is explicit.
-- Reviews already support (order_id, product_id) or (order_id, service_id).
-- This migration only adds a comment; no structural change required for current flow.

COMMENT ON TABLE public.reviews IS 'User reviews for products/services. One row per (order_id, product_id) or (order_id, service_id). Only allowed after order is delivered.';

-- Ensure order status CHECK includes delivered (already in schema)
-- No ALTER needed; status enum already has: pending, confirmed, dispatched, delivered, cancelled
