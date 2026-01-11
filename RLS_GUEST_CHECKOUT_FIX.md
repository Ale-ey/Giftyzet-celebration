# Fix RLS for Guest Checkout

## Problem
When users try to create orders without being logged in (guest checkout), they get an RLS (Row Level Security) error because the database policies require authentication.

## Solution
Update RLS policies to allow:
1. **Guest checkout** - Anonymous users can create orders
2. **Gift orders** - Recipients can view and update orders using gift token (no login required)
3. **Self orders** - Guests can place orders for themselves
4. **Logged-in users** - Can still view and manage their own orders

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the Migration**
   - Open the file: `supabase/migrations/20260111_fix_guest_checkout_rls.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" button
   - Wait for confirmation message
   - Check for any errors

5. **Verify**
   - Go to "Table Editor"
   - Select "orders" table
   - Click on "RLS" tab
   - You should see the new policies listed

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to your project directory
cd F:\VS Code\Butt\giftyzel

# Run the migration
supabase db push

# Or apply specific migration
supabase migration up
```

## What This Migration Does

### 1. Orders Table (`public.orders`)

**New Policies:**

✅ **Allow anyone to create orders**
   - Enables guest checkout
   - No authentication required for INSERT

✅ **Users can view their own orders**
   - Logged-in users see orders where `user_id = auth.uid()`

✅ **Anyone can view orders by gift token**
   - Gift recipients can view without login
   - Uses `gift_token` for access

✅ **Anyone can update orders by gift token**
   - Gift recipients can confirm address
   - No login required

✅ **Admins can view all orders**
   - Admin role can see everything

✅ **Vendors can view orders with their items**
   - Vendors see orders containing their products/services

### 2. Order Items Table (`public.order_items`)

**New Policies:**

✅ **Allow anyone to create order items**
   - Required for guest checkout
   - Works with orders creation

✅ **Anyone can view order items for accessible orders**
   - Can view items if you can view the order
   - Inherits access from orders policies

### 3. Vendor Orders Table (`public.vendor_orders`)

**New Policies:**

✅ **Allow anyone to create vendor orders**
   - Required during order creation process

✅ **Vendors can view/update their orders**
   - Vendors manage their own order fulfillment

✅ **Admins can view/update all vendor orders**
   - Admin oversight capabilities

### 4. Products/Services/Stores

**Additional Policies:**

✅ **Anyone can view available products**
✅ **Anyone can view available services**
✅ **Anyone can view approved stores**

These are needed for order creation to work properly.

## Testing After Migration

### Test 1: Guest Checkout (Self Order)

1. **Log out** from your account (or use incognito mode)
2. Add items to cart
3. Click "Proceed to Checkout"
4. Check "This order is for myself" ✓
5. Fill your contact details
6. Complete payment
7. **Expected**: Order should be created successfully

### Test 2: Guest Gift Order

1. **Log out** from your account
2. Add items to cart
3. Click "Proceed to Checkout"
4. **Uncheck** "This order is for myself" ☐
5. Fill sender and receiver details
6. Complete payment
7. **Expected**: Order created, gift link generated

### Test 3: Gift Receiver (No Login)

1. **Open gift link** in incognito/private window
2. **Expected**: Can view sender info and gift details
3. Fill delivery address
4. Click "Confirm & Accept"
5. **Expected**: Address saved, order confirmed

### Test 4: Logged-In User Orders

1. **Log in** to your account
2. Add items to cart
3. Complete checkout
4. Go to profile/orders page
5. **Expected**: Can see your orders

### Test 5: Vendor Orders

1. **Log in as vendor**
2. Go to vendor orders page
3. **Expected**: Can see orders with your products
4. Can update order status

## Verification Queries

Run these in Supabase SQL Editor to verify policies are working:

```sql
-- Check orders policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'orders';

-- Check order_items policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'order_items';

-- Check vendor_orders policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'vendor_orders';
```

## Expected Policy Count

After migration, you should see:

- **orders**: 7 policies
- **order_items**: 2 policies
- **vendor_orders**: 5 policies

## Security Notes

### ✅ Security Features Maintained:

1. **User Privacy**: Users can only see their own orders
2. **Vendor Isolation**: Vendors only see orders with their items
3. **Admin Access**: Admins have oversight of all orders
4. **Gift Privacy**: Gift orders accessible only via unique token
5. **Data Integrity**: Proper constraints and checks maintained

### ⚠️ Important:

- Guest orders have `user_id = NULL`
- Gift tokens must be kept secure (unique, unguessable)
- Gift links should be shared securely
- Consider adding rate limiting for order creation

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- This will disable guest checkout
-- Only use if you want to revert to authenticated-only orders

DROP POLICY IF EXISTS "Allow anyone to create orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anyone to create order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow anyone to create vendor orders" ON public.vendor_orders;
DROP POLICY IF EXISTS "Anyone can view orders by gift token" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders by gift token" ON public.orders;

-- Then recreate strict policies
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

## Troubleshooting

### Issue: Still getting RLS error

**Solution:**
1. Verify migration ran successfully
2. Check if RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'orders';`
3. Verify policies exist (use verification queries above)
4. Clear browser cache and try again

### Issue: Can't view orders after login

**Solution:**
1. Verify user_id is set correctly in orders
2. Check if user is authenticated: `SELECT auth.uid();`
3. Verify "Users can view their own orders" policy exists

### Issue: Gift receiver can't access link

**Solution:**
1. Verify gift_token is set in order
2. Check if "Anyone can view orders by gift token" policy exists
3. Verify gift link URL is correct

### Issue: Vendors can't see orders

**Solution:**
1. Verify vendor_id is set correctly in vendor_orders table
2. Check if vendor user_id matches logged-in user
3. Verify "Vendors can view orders with their items" policy exists

## Support

If you encounter issues:

1. Check Supabase logs in Dashboard → Logs
2. Check browser console for errors
3. Verify policies are created correctly
4. Test with different user roles
5. Check network tab for API errors

## Additional Resources

- Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL Policies: https://www.postgresql.org/docs/current/sql-createpolicy.html
- Testing RLS: https://supabase.com/docs/guides/auth/row-level-security#testing-policies

## Summary

This migration enables:
✅ Guest checkout for both self and gift orders
✅ Gift recipients can confirm address without login
✅ Logged-in users can view their orders
✅ Vendors can manage their orders
✅ Admins have full access
✅ Proper security and privacy maintained

**Status**: Ready to apply
**Breaking Changes**: None
**Backward Compatible**: Yes
