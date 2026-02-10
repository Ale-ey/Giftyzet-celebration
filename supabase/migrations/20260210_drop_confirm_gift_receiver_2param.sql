-- Remove 2-param overload so PostgREST can resolve confirm_gift_receiver (PGRST203).
-- Keep only the 5-param function: confirm_gift_receiver(p_gift_token, p_receiver_address, p_receiver_name, p_receiver_email, p_receiver_phone)
DROP FUNCTION IF EXISTS public.confirm_gift_receiver(text, text);
