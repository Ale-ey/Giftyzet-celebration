# RLS Policy Fix for User Signup

## Problem
When users try to sign up, they get this error:
```
new row violates row-level security policy for table "users"
```

## Root Cause
The `users` table had SELECT and UPDATE policies, but was missing an INSERT policy. This prevented users from creating their profile during signup.

## Solution

### Option 1: Run the Fix SQL (Quick Fix)
Run this SQL in your Supabase SQL Editor:

```sql
-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow vendors to insert their own vendor profile during vendor signup
CREATE POLICY "Vendors can insert own profile" ON public.vendors
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());
```

### Option 2: Use the Fix File
Run `supabase/fix_rls_policies.sql` in your Supabase SQL Editor. This will add both user and vendor INSERT policies.

### Option 3: Update Schema (For New Deployments)
The `supabase/schema.sql` file has been updated to include the INSERT policy. If you're setting up a new database, use the updated schema.

## What the Policy Does

The policy `"Users can insert own profile"` allows:
- ✅ Authenticated users to create their profile
- ✅ Users can only insert a row where `id = auth.uid()` (their own user ID)
- ✅ Prevents users from creating profiles for other users

## Verification

After applying the fix, verify the policy exists:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND policyname = 'Users can insert own profile';
```

You should see:
- `cmd`: `INSERT`
- `with_check`: `(auth.uid() = id)`

## Testing

After applying the fix:
1. Try signing up a new user
2. The signup should succeed without RLS errors
3. The user profile should be created in the `users` table

## Additional Notes

- The policy uses `WITH CHECK` to ensure users can only create profiles with their own user ID
- This works because during signup, Supabase Auth creates the user first, then the profile is created with the same ID
- The policy is secure because it prevents users from creating profiles for other users

## Related Policies

Make sure these policies also exist:

### Users Table
- ✅ `Users can view own profile` - SELECT policy
- ✅ `Users can insert own profile` - INSERT policy (NEW)
- ✅ `Users can update own profile` - UPDATE policy

### Vendors Table
- ✅ `Vendors can view own profile` - SELECT policy
- ✅ `Vendors can insert own profile` - INSERT policy (NEW)
- ✅ `Vendors can update own profile` - UPDATE policy

## Additional Fix for Vendors

If you also get RLS errors when vendors sign up, make sure the vendors table INSERT policy exists. The fix file includes both policies.

