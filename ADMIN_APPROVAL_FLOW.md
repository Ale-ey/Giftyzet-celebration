# Admin Store Approval Flow

## Overview
This document explains the complete flow for admin store approval using Supabase.

## Database Schema

### Stores Table
```sql
CREATE TABLE public.stores (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Flow Steps

### 1. Vendor Registration
1. Vendor signs up with role 'vendor'
2. Vendor creates store with `status='pending'`
3. Store is saved to Supabase
4. Vendor is redirected to `/vendor/register-store` (pending approval page)

### 2. Admin Review
1. Admin logs in (user with role='admin')
2. Admin navigates to `/admin` dashboard
3. Admin sees all pending stores in "Pending Store Approvals" section
4. Each pending store shows:
   - Store name
   - Vendor business name
   - Contact email
   - Phone number
   - Address
   - Category
   - Description

### 3. Admin Actions

#### Approve Store
```typescript
// Admin clicks "Approve" button
await approveStore(storeId, adminUserId)
// Updates: status='approved', approved_at=NOW(), approved_by=adminId
```

#### Reject Store
```typescript
// Admin clicks "Reject" button
await rejectStore(storeId)
// Updates: status='rejected', suspended_at=NOW()
```

#### Suspend Store (from approved stores)
```typescript
// Admin clicks suspend button on approved store
await suspendStore(storeId)
// Updates: status='suspended', suspended_at=NOW()
```

#### Reactivate Store (from suspended stores)
```typescript
// Admin clicks "Reactivate" button on suspended store
await approveStore(storeId, adminUserId)
// Updates: status='approved', approved_at=NOW(), suspended_at=null
```

### 4. Vendor Experience

#### Pending Status
- Vendor cannot access dashboard
- Redirected to `/vendor/register-store` with pending message

#### Approved Status
- Vendor can access full dashboard at `/vendor`
- Can manage products, services, and orders
- Can update store settings

#### Suspended Status
- Vendor sees suspension dialog
- Message: "Your store has been suspended due to suspicious activity"
- Contact email shown: `help@giftyzel.com`
- Cannot access any dashboard features
- All vendor pages redirect to suspension page

#### Rejected Status
- Similar to pending
- Vendor redirected to registration page

## API Functions

### Admin Functions (lib/api/vendors.ts)

```typescript
// Get all pending stores
getPendingStores() // Returns stores with status='pending'

// Get all approved stores
getAllApprovedStores() // Returns stores with status='approved'

// Get all suspended stores
getSuspendedStores() // Returns stores with status='suspended'

// Approve a store
approveStore(storeId, adminUserId)

// Suspend a store
suspendStore(storeId)

// Reject a store
rejectStore(storeId)
```

### Vendor Functions

```typescript
// Get vendor by user ID
getVendorByUserId(userId)

// Get store by vendor ID
getStoreByVendorId(vendorId)

// Update store
updateStore(storeId, storeData)
```

## RLS Policies

### Required Policies (supabase/admin_policies.sql)

```sql
-- Admins can update any store
CREATE POLICY "Admins can update any store" ON public.stores
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Anyone can view stores based on role
CREATE POLICY "Anyone can view stores" ON public.stores
  FOR SELECT USING (
    status = 'approved' OR 
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()) OR 
    public.is_admin()
  );
```

## Setup Instructions

### 1. Run Database Migrations
```bash
# Apply main schema
psql -h your-db-host -U postgres -d postgres -f supabase/schema.sql

# Apply admin policies
psql -h your-db-host -U postgres -d postgres -f supabase/admin_policies.sql
```

### 2. Create Admin User
```sql
-- Update an existing user to admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@giftyzel.com';
```

### 3. Test the Flow
1. Create a vendor account
2. Register a store (will be pending)
3. Login as admin
4. Approve the store
5. Login as vendor again
6. Verify dashboard access

## Access Control Matrix

| Store Status | Vendor Can See Dashboard | Vendor Can Manage | Admin Actions Available |
|--------------|--------------------------|-------------------|-------------------------|
| Pending      | ❌ No                    | ❌ No            | Approve, Reject         |
| Approved     | ✅ Yes                   | ✅ Yes           | Suspend                 |
| Suspended    | ❌ No (Dialog shown)     | ❌ No            | Reactivate              |
| Rejected     | ❌ No                    | ❌ No            | Approve                 |

## Security Notes

1. **Admin Role Check**: All admin functions verify `is_admin()` through RLS
2. **Vendor Isolation**: Vendors can only see their own stores
3. **Public Access**: Only approved stores are visible to public
4. **Audit Trail**: `approved_by` tracks which admin approved the store
5. **Timestamps**: `approved_at` and `suspended_at` track action times

## Components

### Admin Dashboard
- `components/admin/AdminDashboard.tsx`
- Shows pending, approved, and suspended stores
- Handles approve, reject, suspend, reactivate actions

### Vendor Dashboard
- `components/vendor/VendorDashboard.tsx`
- Checks store status from Supabase
- Shows suspension dialog if suspended
- Redirects to registration if pending/rejected

### Vendor Pages
- All vendor pages check suspension status
- Redirect to dashboard if suspended
- Dashboard shows suspension message

## Error Handling

- API errors are caught and shown to admin
- Failed updates show alert message
- Store list reloads after each action
- Loading states prevent duplicate actions

