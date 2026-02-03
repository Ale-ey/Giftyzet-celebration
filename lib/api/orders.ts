import { supabase } from '../supabase/client'

export interface OrderItemData {
  item_type: 'product' | 'service'
  product_id?: string
  service_id?: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

export interface CreateOrderData {
  user_id?: string // null for guest orders
  order_type: 'self' | 'gift'
  sender_name: string
  sender_email: string
  sender_phone: string
  sender_address: string
  receiver_name?: string
  receiver_email?: string
  receiver_phone?: string
  receiver_address?: string
  shipping_address?: string
  items: OrderItemData[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}

// Create order (order + order_items in one transaction via RPC; trigger decreases product stock)
export async function createOrder(orderData: CreateOrderData) {
  const giftToken = orderData.order_type === 'gift'
    ? `gift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    : null

  const giftLink = giftToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/gift-receiver/${giftToken}`
    : null

  const orderPayload = {
    order_number: `ORD-${Date.now()}`,
    user_id: orderData.user_id || null,
    order_type: orderData.order_type,
    sender_name: orderData.sender_name,
    sender_email: orderData.sender_email,
    sender_phone: orderData.sender_phone,
    sender_address: orderData.sender_address,
    receiver_name: orderData.receiver_name ?? '',
    receiver_email: orderData.receiver_email ?? '',
    receiver_phone: orderData.receiver_phone ?? '',
    receiver_address: orderData.receiver_address ?? '',
    shipping_address: orderData.shipping_address ?? '',
    subtotal: orderData.subtotal,
    shipping: orderData.shipping,
    tax: orderData.tax,
    total: orderData.total,
    gift_token: giftToken ?? '',
    gift_link: giftLink ?? '',
    status: orderData.order_type === 'gift' ? 'pending' : 'confirmed',
  }

  const itemsPayload = orderData.items.map((item) => ({
    item_type: item.item_type,
    product_id: item.product_id ?? '',
    service_id: item.service_id ?? '',
    name: item.name,
    price: item.price,
    quantity: item.quantity || 1,
    image_url: item.image_url ?? '',
  }))

  const { data: orderJson, error: rpcError } = await supabase.rpc('create_order', {
    order_data: orderPayload,
    items_data: itemsPayload,
  })

  if (rpcError) {
    const msg = rpcError.message || 'Failed to create order'
    if (msg.includes('Insufficient stock') || msg.includes('stock')) {
      throw new Error('Insufficient stock for one or more products. Please update your cart and try again.')
    }
    throw new Error(msg)
  }

  const order = orderJson as any
  if (!order?.id) throw new Error('Order was not created')

  // Create vendor orders (group by vendor/store)
  const vendorOrderMap = new Map<string, { vendorId: string; storeId: string }>()

  // Get vendor/store info for each item
  for (const item of orderData.items) {
    if (item.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('store_id, stores!inner(vendor_id)')
        .eq('id', item.product_id)
        .single()

      if (product) {
        const storeId = product.store_id
        // Get store to find vendor_id
        const { data: store } = await supabase
          .from('stores')
          .select('vendor_id')
          .eq('id', storeId)
          .single()

        if (store) {
          const vendorId = store.vendor_id
          vendorOrderMap.set(`${vendorId}-${storeId}`, { vendorId, storeId })
        }
      }
    } else if (item.service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('store_id')
        .eq('id', item.service_id)
        .single()

      if (service) {
        const storeId = service.store_id
        // Get store to find vendor_id
        const { data: store } = await supabase
          .from('stores')
          .select('vendor_id')
          .eq('id', storeId)
          .single()

        if (store) {
          const vendorId = store.vendor_id
          vendorOrderMap.set(`${vendorId}-${storeId}`, { vendorId, storeId })
        }
      }
    }
  }

  // Create vendor order entries
  const vendorOrders = Array.from(vendorOrderMap.values()).map(({ vendorId, storeId }) => ({
    order_id: order.id,
    vendor_id: vendorId,
    store_id: storeId,
    status: orderData.order_type === 'gift' ? 'pending' : 'confirmed',
  }))

  if (vendorOrders.length > 0) {
    const { error: vendorOrdersError } = await supabase
      .from('vendor_orders')
      .insert(vendorOrders)

    if (vendorOrdersError) throw vendorOrdersError
  }

  return { order, giftToken, giftLink }
}

// Get orders by user ID
export async function getOrdersByUserId(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get orders by vendor ID
export async function getOrdersByVendorId(vendorId: string) {
  const { data, error } = await supabase
    .from('vendor_orders')
    .select('*, orders(*, order_items(*))')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get order by ID
export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()

  if (error) throw error
  return data
}

// Update order status
export async function updateOrderStatus(orderId: string, status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled') {
  const updateData: any = { status }
  
  if (status === 'confirmed') {
    updateData.confirmed_at = new Date().toISOString()
  } else if (status === 'dispatched') {
    updateData.dispatched_at = new Date().toISOString()
  } else if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  } else if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update vendor order status
// Note: vendor_orders has status and delivered_at only (no dispatched_at column); orders table has dispatched_at
export async function updateVendorOrderStatus(orderId: string, vendorId: string, status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled') {
  const updateData: any = { status }
  if (status === 'delivered') {
    updateData.delivered_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('vendor_orders')
    .update(updateData)
    .eq('order_id', orderId)
    .eq('vendor_id', vendorId)
    .select()
    .single()

  if (error) throw error

  // Update main order status if needed
  if (status === 'dispatched') {
    await updateOrderStatus(orderId, 'dispatched')
  }
  if (status === 'delivered') {
    await updateOrderStatus(orderId, 'delivered')
  }

  return data
}

// Confirm gift receiver address
export async function confirmGiftReceiver(giftToken: string, receiverAddress: string) {
  // Find order by gift token
  const { data: order, error: findError } = await supabase
    .from('orders')
    .select('*')
    .eq('gift_token', giftToken)
    .single()

  if (findError) throw findError

  // Update order with receiver address and confirm
  const { data, error } = await supabase
    .from('orders')
    .update({
      receiver_address: receiverAddress,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .select()
    .single()

  if (error) throw error

  // Update vendor orders status
  await supabase
    .from('vendor_orders')
    .update({ status: 'confirmed' })
    .eq('order_id', order.id)

  return data
}

// Get order by gift token
export async function getOrderByGiftToken(giftToken: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('gift_token', giftToken)
    .single()

  if (error) throw error
  return data
}

