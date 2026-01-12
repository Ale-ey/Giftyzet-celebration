# Email Confirmation and Vendor Signup Fix

## Issues Fixed

### 1. RLS Policy Errors
- **Problem**: `new row violates row-level security policy for table "vendors"` and `"users"` during signup
- **Root Cause**: Vendor creation was happening immediately after signup, before email confirmation, so `auth.uid()` might not be available
- **Solution**: 
  - Show email confirmation message after signup
  - Vendor profile is created automatically via database trigger after email confirmation
  - User profile is created via existing trigger on user signup

### 2. Email Confirmation Flow
- **Problem**: No indication that email confirmation is required
- **Solution**: 
  - Added email confirmation message in AuthModal and vendor signup page
  - Shows "Check your email" message with instructions
  - Vendor profile created automatically after email confirmation

### 3. Password Visibility Toggle
- **Problem**: No eye icon to show/hide password in login modal
- **Solution**: Added password visibility toggle with Eye/EyeOff icons

### 4. Vendor Login Redirect
- **Problem**: Vendor login redirected to profile page instead of vendor dashboard
- **Solution**: Check user role after login and redirect vendors to `/vendor/dashboard`

## Changes Made

### 1. AuthModal (`components/AuthModal.tsx`)
- ✅ Added password visibility toggle (Eye/EyeOff icons)
- ✅ Added email confirmation message display
- ✅ Updated signup to handle email confirmation
- ✅ Vendor login redirects to vendor dashboard
- ✅ Stores `vendor_name` in user metadata for trigger

### 2. Vendor Signup Page (`app/auth/vendor/signup/page.tsx`)
- ✅ Added email confirmation message display
- ✅ Handles email confirmation flow
- ✅ Shows "Check your email" message instead of immediate redirect

### 3. Auth API (`lib/api/auth.ts`)
- ✅ Returns `needsEmailConfirmation` flag
- ✅ Stores `vendor_name` in user metadata
- ✅ Added email redirect URL for confirmation

### 4. Database Triggers (`supabase/vendor_signup_trigger.sql` & `supabase/QUICK_FIX.sql`)
- ✅ Created `handle_vendor_signup()` function
- ✅ Trigger `on_email_confirmed` fires when email is confirmed
- ✅ Automatically creates vendor profile and store after email confirmation

## How It Works

### User Signup Flow
1. User signs up → Email confirmation required
2. Shows "Check your email" message
3. User clicks confirmation link in email
4. User profile created automatically via trigger
5. User can now login

### Vendor Signup Flow
1. Vendor signs up with business name → Email confirmation required
2. Shows "Check your email" message
3. Vendor clicks confirmation link in email
4. `on_email_confirmed` trigger fires
5. `handle_vendor_signup()` function creates:
   - Vendor profile in `vendors` table
   - Store with "pending" status in `stores` table
6. Vendor can now login and will be redirected to vendor dashboard

### Vendor Login Flow
1. Vendor logs in
2. System checks user role
3. If role is "vendor" → Redirect to `/vendor/dashboard`
4. If role is "user" → Redirect to `/profile`

## SQL Setup Required

Run these SQL scripts in Supabase SQL Editor:

1. **First**: `supabase/QUICK_FIX.sql` - Fixes RLS policies and creates user trigger
2. **Second**: `supabase/vendor_signup_trigger.sql` - Creates vendor signup trigger

Or run the updated `supabase/QUICK_FIX.sql` which includes everything.

## Testing

1. **Test User Signup:**
   - Sign up as regular user
   - Should see "Check your email" message
   - Confirm email
   - Login → Should redirect to profile

2. **Test Vendor Signup:**
   - Sign up as vendor
   - Should see "Check your email" message
   - Confirm email
   - Vendor profile and store should be created automatically
   - Login → Should redirect to vendor dashboard

3. **Test Password Visibility:**
   - Open login modal
   - Click eye icon → Password should toggle visibility

4. **Test Vendor Login:**
   - Login as vendor
   - Should redirect to `/vendor/dashboard` (not `/profile`)

## Notes

- Email confirmation is required by default in Supabase
- If email confirmation is disabled in Supabase settings, vendor will be created immediately
- Vendor name is stored in user metadata so trigger can access it
- All RLS policies are properly configured to allow vendor creation after email confirmation

