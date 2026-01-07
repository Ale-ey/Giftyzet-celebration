# Profile Flow and RLS Recursion Fix

## Issues Fixed

### 1. RLS Infinite Recursion Error
**Problem:** `GET /rest/v1/users?select=*&id=eq.{user_id}` was returning:
```json
{
  "code": "42P17",
  "message": "infinite recursion detected in policy for relation \"users\""
}
```

**Root Cause:** RLS policies were checking `(SELECT role FROM public.users WHERE id = auth.uid())` which triggered the same SELECT policy, creating infinite recursion.

**Solution:** Created `public.is_admin()` helper function that uses `SECURITY DEFINER` to bypass RLS when checking admin status.

### 2. Profile Page Redirect Issue
**Problem:** After login, user was redirected to profile page but then immediately redirected back to home.

**Root Cause:** 
- Profile page was redirecting on any error loading profile
- RLS recursion error was causing profile load to fail
- No fallback to show form with pre-filled data

**Solution:**
- Profile page now stays on page even if profile doesn't exist
- Shows form with email/name pre-filled from auth user
- Creates profile when user saves
- Only redirects on actual authentication errors

## Changes Made

### 1. Database Schema (`supabase/schema.sql`)
- Added `public.is_admin()` function to avoid recursion
- Updated all RLS policies to use `public.is_admin()` instead of direct role check

### 2. Quick Fix Script (`supabase/QUICK_FIX.sql`)
- Includes both recursion fix and signup trigger fix
- Can be run directly in Supabase SQL Editor

### 3. Profile Page (`components/profile/ProfilePage.tsx`)
- Improved error handling - doesn't redirect on profile load errors
- Pre-fills email and name from auth user metadata
- Creates profile automatically when user saves if it doesn't exist
- Only redirects on actual authentication failures

### 4. Profile API (`lib/api/profile.ts`)
- Updated `setProfile()` to handle email parameter
- Better error handling for profile creation

## How to Apply

1. **Run the Quick Fix in Supabase SQL Editor:**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `supabase/QUICK_FIX.sql`
   - Run the script

2. **Test the Flow:**
   - Login via modal
   - Should redirect to `/profile`
   - Profile page should load with email/name pre-filled
   - User can complete remaining fields (phone, address, avatar)
   - Save creates/updates profile

## Expected Behavior

1. **After Login:**
   - User redirected to `/profile`
   - Profile page loads (even if profile doesn't exist in DB)
   - Email and name are pre-filled from auth user
   - User can add phone, address, avatar

2. **On Save:**
   - If profile exists → Updates it
   - If profile doesn't exist → Creates it
   - Success message shown
   - Profile data persisted to Supabase

3. **On Error:**
   - If auth error → Redirects to home
   - If profile load error → Shows form with pre-filled data
   - User can still save and create profile

## Testing

1. Test user profile fetch:
   ```
   GET /rest/v1/users?select=*&id=eq.{user_id}
   ```
   Should return user data without recursion error.

2. Test login flow:
   - Login via modal
   - Should redirect to `/profile`
   - Should stay on profile page (not redirect back to home)
   - Email and name should be pre-filled

3. Test profile save:
   - Fill in phone, address
   - Click "Save Changes"
   - Should create/update profile successfully

