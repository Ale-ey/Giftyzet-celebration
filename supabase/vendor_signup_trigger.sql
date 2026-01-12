-- ============================================
-- Trigger to create vendor profile after email confirmation
-- This handles vendor creation when user confirms their email
-- ============================================

-- Function to handle vendor creation after email confirmation
CREATE OR REPLACE FUNCTION public.handle_vendor_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  vendor_name TEXT;
BEGIN
  -- Get user role from metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Only proceed if user is a vendor
  IF user_role = 'vendor' THEN
    -- Get vendor name from metadata or email
    vendor_name := COALESCE(
      NEW.raw_user_meta_data->>'vendor_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    );
    
    -- Check if vendor already exists
    IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE user_id = NEW.id) THEN
      -- Create vendor profile
      INSERT INTO public.vendors (
        user_id,
        vendor_name,
        business_name,
        email,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        vendor_name,
        vendor_name,
        NEW.email,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO NOTHING;
      
      -- Create store with pending status
      INSERT INTO public.stores (
        vendor_id,
        name,
        description,
        email,
        status,
        created_at,
        updated_at
      )
      SELECT 
        v.id,
        vendor_name,
        'Store for ' || vendor_name,
        NEW.email,
        'pending',
        NOW(),
        NOW()
      FROM public.vendors v
      WHERE v.user_id = NEW.id
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users update for email confirmation
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_vendor_signup();

-- Also create vendor on first login if not exists
CREATE OR REPLACE FUNCTION public.handle_first_login()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called when user logs in for the first time
  -- Check if vendor profile needs to be created
  IF NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM public.handle_vendor_signup();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

