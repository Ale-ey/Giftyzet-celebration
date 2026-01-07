# RLS Infinite Recursion Fix

## Problem
The RLS policies were causing infinite recursion because they were checking `(SELECT role FROM public.users WHERE id = auth.uid())` which triggered the same SELECT policy, creating a loop.

## Solution
Created a helper function `public.is_admin()` that uses `SECURITY DEFINER` to bypass RLS when checking if a user is an admin. This function:
- Checks if user is authenticated
- Uses `EXISTS` with `LIMIT 1` to avoid full table scans
- Uses `SECURITY DEFINER` to bypass RLS during the check

## How to Apply

1. **Run the fix script in Supabase SQL Editor:**
   ```sql
   -- Copy and paste the contents of supabase/fix_rls_recursion.sql
   ```

2. **Or update your schema.sql:**
   - The `is_admin()` function has been added to `supabase/schema.sql`
   - All policies that checked `(SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'` have been updated to use `public.is_admin()`

## Files Updated
- `supabase/schema.sql` - Added `is_admin()` function and updated all policies
- `supabase/fix_rls_recursion.sql` - Standalone fix script

## Testing
After applying the fix:
1. Try to fetch user profile: `GET /rest/v1/users?select=*&id=eq.{user_id}`
2. Should return user data without recursion error
3. Profile page should load correctly after login

