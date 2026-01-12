# API Integration Guide

This guide explains how to integrate the Supabase APIs into your application components.

## Overview

The API layer is organized into modules:
- `auth.ts` - Authentication (sign up, sign in, password management)
- `vendors.ts` - Vendor and store management
- `products.ts` - Product and service CRUD operations
- `orders.ts` - Order creation and management
- `storage.ts` - Image upload to Supabase Storage
- `admin.ts` - Admin operations (store approval, etc.)

## Authentication Flow

### Sign Up

```typescript
import { signUp } from '@/lib/api/auth'

try {
  const { user } = await signUp({
    email: 'user@example.com',
    password: 'securepassword',
    name: 'John Doe',
    role: 'user' // or 'vendor' or 'admin'
  })
  console.log('User created:', user)
} catch (error) {
  console.error('Sign up failed:', error)
}
```

### Sign In

```typescript
import { signIn } from '@/lib/api/auth'

try {
  const { user, session } = await signIn({
    email: 'user@example.com',
    password: 'securepassword'
  })
  console.log('Signed in:', user)
} catch (error) {
  console.error('Sign in failed:', error)
}
```

### Update Profile

```typescript
import { updateUserProfile, getCurrentUser } from '@/lib/api/auth'

const user = await getCurrentUser()
if (user) {
  await updateUserProfile(user.id, {
    name: 'John Doe',
    phone_number: '+1234567890',
    address: '123 Main St',
    avatar_url: 'https://...'
  })
}
```

## Vendor Flow

### 1. Create Vendor Profile

```typescript
import { createVendor } from '@/lib/api/vendors'
import { getCurrentUser } from '@/lib/api/auth'

const user = await getCurrentUser()
if (user) {
  const vendor = await createVendor(user.id, {
    vendor_name: 'My Store',
    business_name: 'My Business Inc',
    phone: '+1234567890',
    email: 'vendor@example.com',
    address: '123 Business St'
  })
}
```

### 2. Create Store

```typescript
import { createStore } from '@/lib/api/vendors'

const store = await createStore(vendorId, {
  name: 'My Awesome Store',
  description: 'We sell amazing products',
  category: 'Electronics',
  address: '123 Store St',
  phone: '+1234567890'
})
// Store status will be 'pending' - needs admin approval
```

### 3. Get Store

```typescript
import { getStoreByVendorId } from '@/lib/api/vendors'

const store = await getStoreByVendorId(vendorId)
if (store.status === 'approved') {
  // Store is live and can add products
}
```

## Products & Services

### Create Product

```typescript
import { createProduct } from '@/lib/api/products'
import { uploadProductImage } from '@/lib/api/storage'

// Upload image first
const imageUrl = await uploadProductImage(imageFile, productId)

// Create product
const product = await createProduct({
  store_id: storeId,
  name: 'Amazing Product',
  description: 'This is an amazing product',
  price: 99.99,
  original_price: 149.99,
  category: 'Electronics',
  image_url: imageUrl,
  stock: 100,
  available: true
})
```

### Create Service

```typescript
import { createService } from '@/lib/api/products'

const service = await createService({
  store_id: storeId,
  name: 'Consultation Service',
  description: 'Professional consultation',
  price: 50.00,
  category: 'Consulting',
  duration: '1 hour',
  location: 'Online',
  available: true
})
```

### Get Products/Services

```typescript
import { getProducts, getServices } from '@/lib/api/products'

// Get all products
const products = await getProducts()

// Get products by category
const electronics = await getProducts('Electronics')

// Get products for a store
const storeProducts = await getProductsByStore(storeId)
```

## Orders

### Create Order (Self Order)

```typescript
import { createOrder } from '@/lib/api/orders'

const order = await createOrder({
  user_id: userId, // null for guest orders
  order_type: 'self',
  sender_name: 'John Doe',
  sender_email: 'john@example.com',
  sender_phone: '+1234567890',
  sender_address: '123 Main St',
  shipping_address: '123 Main St',
  items: [
    {
      item_type: 'product',
      product_id: 'product-uuid',
      name: 'Product Name',
      price: 99.99,
      quantity: 2,
      image_url: 'https://...'
    }
  ],
  subtotal: 199.98,
  shipping: 9.99,
  tax: 16.80,
  total: 226.77
})
```

### Create Gift Order

```typescript
const order = await createOrder({
  user_id: userId,
  order_type: 'gift',
  sender_name: 'John Doe',
  sender_email: 'john@example.com',
  sender_phone: '+1234567890',
  sender_address: '123 Main St',
  receiver_name: 'Jane Doe',
  receiver_email: 'jane@example.com',
  receiver_phone: '+0987654321',
  receiver_address: '', // Will be filled by receiver
  items: [...],
  subtotal: 199.98,
  shipping: 9.99,
  tax: 16.80,
  total: 226.77
})

// Gift link is returned
console.log('Share this link:', order.giftLink)
```

### Confirm Gift Receiver Address

```typescript
import { confirmGiftReceiver } from '@/lib/api/orders'

await confirmGiftReceiver(giftToken, '456 Receiver St')
// Order status changes from 'pending' to 'confirmed'
```

### Get Orders

```typescript
import { getOrdersByUserId, getOrdersByVendorId } from '@/lib/api/orders'

// Get user orders
const userOrders = await getOrdersByUserId(userId)

// Get vendor orders
const vendorOrders = await getOrdersByVendorId(vendorId)
```

### Update Order Status (Vendor)

```typescript
import { updateVendorOrderStatus } from '@/lib/api/orders'

// Mark as dispatched
await updateVendorOrderStatus(orderId, vendorId, 'dispatched')

// Mark as delivered
await updateVendorOrderStatus(orderId, vendorId, 'delivered')
```

## Image Upload

### Upload Avatar

```typescript
import { uploadAvatar } from '@/lib/api/storage'

const avatarUrl = await uploadAvatar(file, userId)
// Use avatarUrl in user profile update
```

### Upload Product Image

```typescript
import { uploadProductImage } from '@/lib/api/storage'

const imageUrl = await uploadProductImage(file, productId)
```

### Upload Store Logo/Banner

```typescript
import { uploadStoreLogo, uploadStoreBanner } from '@/lib/api/storage'

const logoUrl = await uploadStoreLogo(file, storeId)
const bannerUrl = await uploadStoreBanner(file, storeId)
```

## Admin Operations

### Get Pending Stores

```typescript
import { getPendingStores } from '@/lib/api/admin'

const pendingStores = await getPendingStores()
```

### Approve Store

```typescript
import { approveStore } from '@/lib/api/admin'

await approveStore(storeId, adminUserId)
```

### Reject Store

```typescript
import { rejectStore } from '@/lib/api/admin'

await rejectStore(storeId, adminUserId)
```

## Error Handling

All API functions throw errors that should be caught:

```typescript
try {
  const result = await someApiFunction()
} catch (error) {
  if (error.message) {
    console.error('API Error:', error.message)
  } else {
    console.error('Unknown error:', error)
  }
  // Show user-friendly error message
}
```

## Integration Examples

### Example: Complete Vendor Setup Flow

```typescript
import { signUp } from '@/lib/api/auth'
import { createVendor, createStore } from '@/lib/api/vendors'

async function setupVendor(email: string, password: string) {
  try {
    // 1. Sign up as vendor
    const { user } = await signUp({
      email,
      password,
      role: 'vendor'
    })

    // 2. Create vendor profile
    const vendor = await createVendor(user.id, {
      vendor_name: 'My Store',
      business_name: 'My Business',
      email,
      phone: '+1234567890'
    })

    // 3. Create store (pending approval)
    const store = await createStore(vendor.id, {
      name: 'My Awesome Store',
      description: 'We sell amazing products',
      category: 'Electronics'
    })

    return { user, vendor, store }
  } catch (error) {
    console.error('Setup failed:', error)
    throw error
  }
}
```

### Example: Complete Order Flow

```typescript
import { createOrder } from '@/lib/api/orders'
import { getCurrentUser } from '@/lib/api/auth'

async function placeOrder(cartItems: CartItem[], orderData: OrderData) {
  try {
    const user = await getCurrentUser()
    
    const order = await createOrder({
      user_id: user?.id || null,
      order_type: orderData.orderType,
      sender_name: orderData.senderName,
      sender_email: orderData.senderEmail,
      sender_phone: orderData.senderPhone,
      sender_address: orderData.senderAddress,
      receiver_name: orderData.receiverName,
      receiver_email: orderData.receiverEmail,
      receiver_phone: orderData.receiverPhone,
      receiver_address: orderData.receiverAddress,
      shipping_address: orderData.orderType === 'self' ? orderData.senderAddress : undefined,
      items: cartItems.map(item => ({
        item_type: item.type,
        product_id: item.type === 'product' ? item.id : undefined,
        service_id: item.type === 'service' ? item.id : undefined,
        name: item.name,
        price: parseFloat(item.price.replace('$', '')),
        quantity: item.quantity,
        image_url: item.image
      })),
      subtotal: calculateSubtotal(cartItems),
      shipping: 9.99,
      tax: calculateTax(cartItems),
      total: calculateTotal(cartItems)
    })

    return order
  } catch (error) {
    console.error('Order failed:', error)
    throw error
  }
}
```

## Best Practices

1. **Always handle errors**: Wrap API calls in try-catch blocks
2. **Check authentication**: Verify user is authenticated before making authenticated requests
3. **Validate data**: Validate input data before sending to API
4. **Loading states**: Show loading indicators during API calls
5. **Optimistic updates**: Update UI optimistically, then sync with server
6. **Cache results**: Cache frequently accessed data (products, stores)
7. **Pagination**: Use pagination for large lists
8. **Error messages**: Show user-friendly error messages

## Migration from localStorage

To migrate from localStorage to Supabase:

1. Replace `localStorage.getItem/setItem` with API calls
2. Update components to use async/await
3. Add loading states
4. Handle errors gracefully
5. Update event listeners to use Supabase real-time subscriptions (optional)

Example migration:

```typescript
// Before (localStorage)
const cart = JSON.parse(localStorage.getItem('cart') || '[]')

// After (Supabase)
const user = await getCurrentUser()
const { data: cart } = await supabase
  .from('carts')
  .select('*, products(*), services(*)')
  .eq('user_id', user.id)
```

