import { supabase } from '../supabase/client'

export interface CreateReviewData {
  order_id: string
  product_id?: string
  service_id?: string
  rating: number
  comment?: string
}

/**
 * Create a review for an order item. Only allowed when order is delivered.
 * Caller must be the order owner (user_id on orders).
 */
export async function createReview(userId: string, data: CreateReviewData) {
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }
  if (!data.product_id && !data.service_id) {
    throw new Error('Either product_id or service_id is required')
  }
  if (data.product_id && data.service_id) {
    throw new Error('Provide either product_id or service_id, not both')
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, status')
    .eq('id', data.order_id)
    .single()

  if (orderError || !order) {
    throw new Error('Order not found')
  }
  if (order.user_id !== userId) {
    throw new Error('You can only review your own orders')
  }
  if (order.status !== 'delivered') {
    throw new Error('You can only review orders that have been delivered')
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      order_id: data.order_id,
      product_id: data.product_id || null,
      service_id: data.service_id || null,
      rating: data.rating,
      comment: data.comment?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to save review')
  }
  return review
}

/**
 * Get reviews for an order (by order_id).
 */
export async function getReviewsForOrder(orderId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', orderId)

  if (error) throw error
  return data || []
}

/**
 * Check if user has already reviewed a specific product/service in an order.
 */
export async function getExistingReview(
  orderId: string,
  productId?: string,
  serviceId?: string
) {
  let query = supabase
    .from('reviews')
    .select('id, rating, comment')
    .eq('order_id', orderId)
  if (productId) query = query.eq('product_id', productId)
  if (serviceId) query = query.eq('service_id', serviceId)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

export interface ReviewWithUser {
  id: string
  rating: number
  comment: string | null
  created_at: string
  users: { name: string | null } | null
}

/**
 * Get reviews for a product (for display on product detail page). Includes reviewer name from users.
 */
export async function getReviewsForProduct(productId: string): Promise<ReviewWithUser[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, users(name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as ReviewWithUser[]
}

/**
 * Get reviews for a service (for display on service detail page). Includes reviewer name from users.
 */
export async function getReviewsForService(serviceId: string): Promise<ReviewWithUser[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, users(name)')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as ReviewWithUser[]
}
