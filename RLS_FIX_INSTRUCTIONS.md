# RLS Policy Fix - Step by Step Instructions

## Problem
You're getting: `new row violates row-level security policy for table "users"` when signing up.

## Solution: Use Database Trigger (Recommended)

The best solution is to use a database trigger that automatically creates the profile. This bypasses RLS issues.

### Step 1: Run the Quick Fix SQL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xwhemtsztjcjvecpcjpy
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the **entire contents** of `supabase/QUICK_FIX.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify you see "Policy created" and "Trigger created" messages

### Step 2: Test Signup

1. Try signing up a new user
2. The signup should now work without RLS errors
3. The profile will be automatically created by the trigger

## What the Fix Does

### 1. INSERT Policy
Allows authenticated users to insert their own profile:
```sql
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2. Database Trigger
Automatically creates profile when user signs up:
- Uses `SECURITY DEFINER` to bypass RLS
- Gets name and role from signup metadata
- Handles conflicts gracefully

### 3. API Updates
The signup API now:
- Passes name and role in signup metadata
- Waits for trigger to execute
- Has fallback to create profile manually if needed
- Retries if profile creation fails

## Alternative: If Trigger Doesn't Work

If you still have issues, try this:

### Option A: Disable Email Confirmation (Temporary)

1. Go to Supabase Dashboard → Authentication → Settings
2. Disable "Enable email confirmations"
3. This ensures users are immediately authenticated after signup
4. Test signup again

### Option B: Use Service Role Key (Not Recommended for Production)

Only use this for testing. Never expose service role key in client code.

## Verification Queries

Run these to verify everything is set up:

```sql
-- Check INSERT policy exists
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'INSERT';

-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

## Troubleshooting

### Still Getting RLS Error?

1. **Check if policy exists:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

2. **Check if trigger exists:**
   ```sql
   SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
   ```

3. **Manually test the trigger:**
   ```sql
   -- This should work if trigger is set up correctly
   SELECT handle_new_user();
   ```

4. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'users';
   ```
   Should return `rowsecurity = true`

### Common Issues

1. **Trigger not firing**: Make sure trigger is on `auth.users` table, not `public.users`
2. **Function permissions**: The function uses `SECURITY DEFINER` which should bypass RLS
3. **Email confirmation**: If enabled, user might not be authenticated until email is confirmed

## Files to Use

- **Quick Fix**: `supabase/QUICK_FIX.sql` - Run this first
- **Detailed Fix**: `supabase/fix_rls_with_trigger.sql` - More detailed version
- **Policy Only**: `supabase/fix_rls_policies.sql` - Just the policies (if trigger doesn't work)

## After Fix

Once the fix is applied:
1. ✅ Users can sign up successfully
2. ✅ Profiles are automatically created
3. ✅ No RLS errors
4. ✅ Works with email confirmation enabled/disabled

