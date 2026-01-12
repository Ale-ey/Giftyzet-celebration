-- Add type field to wishlists table
ALTER TABLE public.wishlists 
ADD COLUMN IF NOT EXISTS type TEXT;

-- Update existing wishlists to have a default type
UPDATE public.wishlists 
SET type = 'Birthday Wishlist' 
WHERE type IS NULL;

