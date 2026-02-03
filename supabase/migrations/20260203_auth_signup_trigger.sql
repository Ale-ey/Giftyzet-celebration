-- ============================================
-- Auth signup: create public.users on auth signup
-- Fixes "Database error updating user" when trigger was missing
-- ============================================

-- Function: create/update public.users when a new user signs up (INSERT into auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_name text;
BEGIN
  -- Validate role: must be one of allowed values (from raw_user_meta_data)
  user_role := COALESCE(trim(NEW.raw_user_meta_data->>'role'), 'user');
  IF user_role NOT IN ('user', 'vendor', 'admin') THEN
    user_role := 'user';
  END IF;

  user_name := COALESCE(
    nullif(trim(NEW.raw_user_meta_data->>'name'), ''),
    nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, user_name, user_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(nullif(trim(EXCLUDED.name), ''), users.name),
    role = EXCLUDED.role,
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Row exists (e.g. race), just update
    UPDATE public.users
    SET email = NEW.email,
        name = COALESCE(nullif(trim(user_name), ''), name),
        role = user_role,
        updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Re-raise so Supabase sees the failure
    RAISE;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates public.users row when a new user signs up (auth.users INSERT). Fixes Database error updating user.';

-- Trigger: run after INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Creates public.users row on signup so RLS and app work.';
