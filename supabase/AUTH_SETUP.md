# Auth + Vendor Signup Setup

**One API:** same `signUp()` for user and vendor. If payload has `role: "vendor"` (and optional `vendor_name`), the trigger creates `public.users` with `role=vendor` and also creates the vendor and store. No separate flow.

## Fix "Database error updating user" (500 on vendor signup)

Run **one script** on your hosted Supabase project:

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Open **`supabase/apply_auth_once.sql`** in your repo, copy its **entire** contents, paste into the SQL Editor, and click **Run**.

That script:

- Defines `handle_new_user()`: on every signup INSERT it creates/updates `public.users` (with `role` from payload); if `role = 'vendor'` it also creates vendor + store. Errors in vendor/store creation never abort signup.
- Creates the trigger `on_auth_user_created` on `auth.users` (INSERT only).
- Drops the `on_email_confirmed` trigger (UPDATE) so only one trigger runs and you don’t get "Database error updating user" from an UPDATE.

Migrations cannot create triggers on `auth.users`, so this script must be run once in the Dashboard. After that, sign up as user or vendor should work.

---

## Fix "new row violates row-level security policy for table stores" (403 on store registration)

Vendors must be able to **insert** and **update** their own store and **select** their pending store. If your migrations left `stores` with only a restrictive SELECT (e.g. `status = 'approved'`), vendors get 403 when registering a store.

**Option A – run migrations**  
Apply migrations so `20260203_stores_rls_vendor_insert.sql` runs. It adds:

- SELECT: public can see approved stores; vendors can see their own (pending or approved); admins see all.
- INSERT: authenticated users can insert a store when `vendor_id` is their vendor.
- UPDATE: vendors can update their own stores.

**Option B – fix in Dashboard**  
In **Supabase Dashboard → SQL Editor**, run the contents of **`supabase/migrations/20260203_stores_rls_vendor_insert.sql`** once. Then try registering the store again.
