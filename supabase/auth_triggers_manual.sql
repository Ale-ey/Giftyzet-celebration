-- ============================================
-- Auth triggers: run ONCE in Supabase Dashboard → SQL Editor
-- Migrations cannot create triggers on auth.users (must be owner of relation).
-- Dashboard SQL Editor runs with sufficient privileges.
-- ============================================

-- Prerequisite: run migrations first so public.handle_new_user and public.handle_vendor_signup exist.

-- Trigger: create public.users row when a new user signs up (INSERT into auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: create vendor + store when email is confirmed (UPDATE auth.users)
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_vendor_signup();
