-- Services: remove duration; price is per hour. Customer chooses hours at order time.
-- order_items: for services, quantity = hours, price = unit price per hour (line total = price * quantity).

ALTER TABLE public.services
  DROP COLUMN IF EXISTS duration;

COMMENT ON COLUMN public.services.price IS 'Price per hour (USD)';
