-- Backfill product and service rating/reviews_count from reviews table (source of truth).
-- Ensures UI shows correct rating even if trigger was not applied or missed.

-- Products: set rating and reviews_count from reviews
UPDATE public.products p
SET
  rating = COALESCE(
    (SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.product_id = p.id),
    0
  ),
  reviews_count = COALESCE(
    (SELECT COUNT(*)::integer FROM public.reviews r WHERE r.product_id = p.id),
    0
  );

-- Services: set rating and reviews_count from reviews
UPDATE public.services s
SET
  rating = COALESCE(
    (SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.service_id = s.id),
    0
  ),
  reviews_count = COALESCE(
    (SELECT COUNT(*)::integer FROM public.reviews r WHERE r.service_id = s.id),
    0
  );

-- Ensure trigger exists so future reviews keep products/services in sync
CREATE OR REPLACE FUNCTION public.update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET
      rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM public.reviews WHERE product_id = NEW.product_id),
      reviews_count = (SELECT COUNT(*)::integer FROM public.reviews WHERE product_id = NEW.product_id)
    WHERE id = NEW.product_id;
  ELSIF NEW.service_id IS NOT NULL THEN
    UPDATE public.services
    SET
      rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM public.reviews WHERE service_id = NEW.service_id),
      reviews_count = (SELECT COUNT(*)::integer FROM public.reviews WHERE service_id = NEW.service_id)
    WHERE id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_rating ON public.reviews;
CREATE TRIGGER update_product_rating
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_item_rating();
