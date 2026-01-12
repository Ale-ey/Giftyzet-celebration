# Alternative Fix for RLS Policy Issue

If you're still getting the RLS error after applying the INSERT policy, use this database trigger approach.

## Problem
Even with the INSERT policy, `auth.uid()` might not be available immediately after `signUp()` because the session isn't fully established yet.

## Solution: Database Trigger

A database trigger automatically creates the user profile when a user signs up, bypassing RLS issues.

### Step 1: Run the Trigger SQL

Run `supabase/fix_rls_with_trigger.sql` in your Supabase SQL Editor.

This will:
1. Create a function `handle_new_user()` that creates the profile
2. Create a trigger that fires when a new user is created in `auth.users`
3. Automatically create the profile with data from signup metadata

### Step 2: Update Signup to Pass Metadata

The signup API has been updated to pass `name` and `role` in the signup metadata, which the trigger will use.

### How It Works

1. User calls `signUp()` with email, password, name, role
2. Supabase creates user in `auth.users`
3. Trigger fires automatically
4. Trigger function creates profile in `public.users` using `SECURITY DEFINER` (bypasses RLS)
5. Profile is created successfully

### Benefits

- ✅ No RLS issues - trigger uses `SECURITY DEFINER`
- ✅ Automatic - no need to manually create profile
- ✅ Reliable - always creates profile when user signs up
- ✅ Fallback - API still tries to create/update profile if trigger fails

### Verification

After running the trigger SQL, test signup:

```sql
-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

### Manual Fallback

The API code has been updated to:
1. Wait for trigger to execute
2. Check if profile was created
3. Create profile manually if trigger didn't work
4. Update profile if it exists but needs updates

This ensures the profile is always created even if the trigger has issues.

