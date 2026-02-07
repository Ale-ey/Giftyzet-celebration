-- ============================================
-- RUN THIS ONCE in Supabase Dashboard → SQL Editor
-- One signup API: if payload has role=vendor, register as vendor (public.users + vendor + store).
-- Only one trigger (INSERT); no UPDATE trigger.
-- ============================================

-- 1) Function: create public.users; if role=vendor also create vendor+store (never abort signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_name text;
  vendor_name text;
  base_name text;
  suffix int;
  meta jsonb;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  user_role := COALESCE(trim(meta->>'role'), 'user');
  IF user_role NOT IN ('user', 'vendor', 'admin') THEN
    user_role := 'user';
  END IF;

  user_name := COALESCE(
    nullif(trim(meta->>'name'), ''),
    nullif(trim(meta->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Always create/update public.users (same for user and vendor)
  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, user_name, user_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(nullif(trim(EXCLUDED.name), ''), users.name),
    role = EXCLUDED.role,
    updated_at = now();

  -- If vendor: create vendor + store (best effort; never abort)
  IF user_role = 'vendor' THEN
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE user_id = NEW.id) THEN
        vendor_name := COALESCE(
          nullif(trim(meta->>'vendor_name'), ''),
          nullif(trim(meta->>'name'), ''),
          split_part(NEW.email, '@', 1)
        );
        IF vendor_name IS NULL OR vendor_name = '' THEN
          vendor_name := split_part(NEW.email, '@', 1);
        END IF;
        base_name := vendor_name;
        suffix := 1;
        WHILE EXISTS (SELECT 1 FROM public.vendors WHERE public.vendors.vendor_name = vendor_name) LOOP
          suffix := suffix + 1;
          vendor_name := base_name || ' (' || suffix || ')';
        END LOOP;
        INSERT INTO public.vendors (user_id, vendor_name, business_name, email, created_at, updated_at)
        VALUES (NEW.id, vendor_name, vendor_name, NEW.email, now(), now())
        ON CONFLICT (user_id) DO NOTHING;
        INSERT INTO public.stores (vendor_id, name, description, email, status, created_at, updated_at)
        SELECT v.id, vendor_name, 'Store for ' || vendor_name, NEW.email, 'pending', now(), now()
        FROM public.vendors v
        WHERE v.user_id = NEW.id
          AND NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.vendor_id = v.id);
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;  /* never abort signup */
    END;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    UPDATE public.users
    SET email = NEW.email, name = COALESCE(nullif(trim(user_name), ''), name), role = user_role, updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    RETURN NEW;  /* never abort: auth user is created */
END;
$$;

-- 2) Only one trigger: on INSERT. Drop UPDATE trigger so it can't cause "Database error updating user"
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
