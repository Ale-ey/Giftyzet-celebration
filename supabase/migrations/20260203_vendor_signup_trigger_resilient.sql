-- ============================================
-- Vendor signup: create vendor + store on email confirmation
-- Resilient to duplicate vendor_name / any DB errors so Auth update never fails
-- Fixes "Database error updating user" when vendor/store insert failed
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_vendor_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
  vendor_name TEXT;
  base_name TEXT;
  suffix INT;
BEGIN
  BEGIN
    user_role := COALESCE(trim(NEW.raw_user_meta_data->>'role'), 'user');
    IF user_role <> 'vendor' THEN
      RETURN NEW;
    END IF;

    -- vendors.user_id REFERENCES public.users(id): ensure row exists (INSERT trigger may not have run)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
      user_name := COALESCE(
        nullif(trim(NEW.raw_user_meta_data->>'name'), ''),
        nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''),
        split_part(NEW.email, '@', 1)
      );
      INSERT INTO public.users (id, email, name, role)
      VALUES (NEW.id, NEW.email, user_name, 'vendor')
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(nullif(trim(EXCLUDED.name), ''), users.name),
        role = 'vendor',
        updated_at = now();
    END IF;

    vendor_name := COALESCE(
      nullif(trim(NEW.raw_user_meta_data->>'vendor_name'), ''),
      nullif(trim(NEW.raw_user_meta_data->>'name'), ''),
      split_part(NEW.email, '@', 1)
    );
    IF vendor_name IS NULL OR vendor_name = '' THEN
      vendor_name := split_part(NEW.email, '@', 1);
    END IF;

    IF EXISTS (SELECT 1 FROM public.vendors WHERE user_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    -- Ensure unique vendor_name: if taken, append (2), (3), ...
    base_name := vendor_name;
    suffix := 1;
    WHILE EXISTS (SELECT 1 FROM public.vendors WHERE public.vendors.vendor_name = vendor_name) LOOP
      suffix := suffix + 1;
      vendor_name := base_name || ' (' || suffix || ')';
    END LOOP;

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
      AND NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.vendor_id = v.id);

  EXCEPTION
    WHEN unique_violation THEN
      NULL;
    WHEN OTHERS THEN
      RAISE WARNING 'handle_vendor_signup: user_id=% error=%', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_vendor_signup() IS 'Creates vendor + store when email is confirmed. Swallows errors so Auth update never fails.';

-- Triggers on auth.users require ownership. Run supabase/auth_triggers_manual.sql once in Dashboard → SQL Editor.
