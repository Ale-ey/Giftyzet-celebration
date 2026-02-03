import { supabase } from '../supabase/client'

export interface VendorData {
  vendor_name: string
  business_name?: string
  business_type?: string
  tax_id?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
}

export interface StoreData {
  name: string
  description?: string
  category?: string
  logo_url?: string
  banner_url?: string
  address?: string
  phone?: string
  email?: string
  website?: string
}

// Create vendor profile
export async function createVendor(userId: string, vendorData: VendorData) {
  const { data, error } = await supabase
    .from('vendors')
    .insert({
      user_id: userId,
      ...vendorData,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get vendor by user ID
export async function getVendorByUserId(userId: string) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

// Create store
export async function createStore(vendorId: string, storeData: StoreData) {
  const { data, error } = await supabase
    .from('stores')
    .insert({
      vendor_id: vendorId,
      ...storeData,
      status: 'pending', // New stores start as pending
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get store by vendor ID
export async function getStoreByVendorId(vendorId: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('vendor_id', vendorId)
    .maybeSingle()

  if (error) throw error
  return data
}

// Update store
export async function updateStore(storeId: string, storeData: Partial<StoreData>) {
  const { data, error } = await supabase
    .from('stores')
    .update(storeData)
    .eq('id', storeId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get approved stores (for public marketplace)
export async function getApprovedStores() {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      vendors (
        id,
        vendor_name,
        business_name,
        email,
        phone
      )
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get top vendors
export async function getTopVendors(limit: number = 10) {
  const { data, error } = await supabase
    .from('top_vendors')
    .select('*')
    .limit(limit)

  if (error) throw error
  return data
}

// Get all vendors with stats, sorted by rating
export async function getTopVendorsByRating(limit?: number) {
  // First get all approved stores with vendor info
  let query = supabase
    .from('stores')
    .select(`
      id,
      name,
      description,
      category,
      logo_url,
      created_at,
      vendors (
        id,
        vendor_name,
        business_name
      )
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  const { data: stores, error: storesError } = await query

  if (storesError) throw storesError
  if (!stores) return []

  // For each store, get aggregated stats
  const storesWithStats = await Promise.all(
    stores.map(async (store) => {
      // Get product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('available', true)

      // Get service count
      const { count: serviceCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('available', true)

      // Get total orders count for this store (delivered = completed orders; vendor_orders has no 'completed' status)
      const { count: ordersCount } = await supabase
        .from('vendor_orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'delivered')

      // Store rating = average of all product and service ratings for this store (same as store detail page)
      const { data: productsForRating } = await supabase
        .from('products')
        .select('rating, reviews_count')
        .eq('store_id', store.id)
      const { data: servicesForRating } = await supabase
        .from('services')
        .select('rating, reviews_count')
        .eq('store_id', store.id)
      const allItemsForRating = [...(productsForRating || []), ...(servicesForRating || [])]
      const totalReviews = allItemsForRating.reduce((sum, item) => sum + (item.reviews_count || 0), 0)
      // Weighted average: sum(rating * reviews_count) / totalReviews so store rating reflects all reviews
      const avgRating = totalReviews > 0
        ? allItemsForRating.reduce((sum, item) => sum + (item.rating || 0) * (item.reviews_count || 0), 0) / totalReviews
        : allItemsForRating.length > 0
          ? allItemsForRating.reduce((sum, item) => sum + (item.rating || 0), 0) / allItemsForRating.length
          : 0

      const vendor = Array.isArray(store.vendors) ? store.vendors[0] : store.vendors
      
      return {
        id: store.id,
        name: store.name,
        description: store.description,
        category: store.category || 'General',
        logo_url: store.logo_url,
        vendor_name: vendor?.vendor_name || vendor?.business_name || 'Unknown',
        vendor_id: vendor?.id,
        rating: Math.round(avgRating * 10) / 10,
        totalReviews,
        totalProducts: (productCount || 0) + (serviceCount || 0),
        totalSales: ordersCount || 0,
        verified: true,
        joinDate: store.created_at
      }
    })
  )

  // Sort by rating (descending), then by total sales
  const sorted = storesWithStats.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating
    }
    return b.totalSales - a.totalSales
  })

  return limit ? sorted.slice(0, limit) : sorted
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

// Get all pending stores (admin only)
export async function getPendingStores() {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      vendors (
        id,
        vendor_name,
        business_name,
        email,
        phone,
        address,
        city,
        state
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get all approved stores (admin only)
export async function getAllApprovedStores() {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      vendors (
        id,
        vendor_name,
        business_name,
        email,
        phone
      )
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get all suspended stores (admin only)
export async function getSuspendedStores() {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      vendors (
        id,
        vendor_name,
        business_name,
        email,
        phone
      )
    `)
    .eq('status', 'suspended')
    .order('suspended_at', { ascending: false })

  if (error) throw error
  return data
}

// Get all stores (admin only)
export async function getAllStores() {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      vendors (
        id,
        vendor_name,
        business_name,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Approve store (admin only)
export async function approveStore(storeId: string, adminUserId: string) {
  const { data, error } = await supabase
    .from('stores')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminUserId,
      suspended_at: null
    })
    .eq('id', storeId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Suspend store (admin only)
export async function suspendStore(storeId: string) {
  const { data, error } = await supabase
    .from('stores')
    .update({
      status: 'suspended',
      suspended_at: new Date().toISOString()
    })
    .eq('id', storeId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Reject store (admin only)
export async function rejectStore(storeId: string) {
  const { data, error } = await supabase
    .from('stores')
    .update({
      status: 'rejected',
      suspended_at: new Date().toISOString()
    })
    .eq('id', storeId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get store by ID (admin)
export async function getStoreById(storeId: string) {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      vendors (
        id,
        vendor_name,
        business_name,
        business_type,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        country
      )
    `)
    .eq('id', storeId)
    .single()

  if (error) throw error
  return data
}

// ============================================
// PUBLIC STORE FUNCTIONS
// ============================================

// Get store by name (for public store page)
export async function getStoreByName(storeName: string) {
  const { data, error } = await supabase
    .from('stores')
    .select(`
      *,
      vendors (
        id,
        vendor_name,
        business_name
      )
    `)
    .eq('status', 'approved')
    .ilike('name', storeName)
    .single()

  if (error) throw error
  return data
}

// Get store with stats by store ID
export async function getStoreWithStats(storeId: string) {
  // Get store details
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select(`
      *,
      vendors (
        id,
        vendor_name,
        business_name
      )
    `)
    .eq('id', storeId)
    .eq('status', 'approved')
    .single()

  if (storeError) throw storeError

  // Get product count
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('available', true)

  // Get service count
  const { count: serviceCount } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('available', true)

  // Get products for rating calculation
  const { data: products } = await supabase
    .from('products')
    .select('rating, reviews_count')
    .eq('store_id', storeId)
    .eq('available', true)

  // Get services for rating calculation
  const { data: services } = await supabase
    .from('services')
    .select('rating, reviews_count')
    .eq('store_id', storeId)
    .eq('available', true)

  // Store rating = weighted average of all product and service ratings (by reviews_count)
  const allItems = [...(products || []), ...(services || [])]
  const totalReviews = allItems.reduce((sum, item) => sum + (item.reviews_count || 0), 0)
  const avgRating = totalReviews > 0
    ? allItems.reduce((sum, item) => sum + (item.rating || 0) * (item.reviews_count || 0), 0) / totalReviews
    : allItems.length > 0
      ? allItems.reduce((sum, item) => sum + (item.rating || 0), 0) / allItems.length
      : 0

  // Get delivered orders count (vendor_orders uses 'delivered', not 'completed')
  const { count: ordersCount } = await supabase
    .from('vendor_orders')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'delivered')

  return {
    ...store,
    stats: {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews,
      totalProducts: (productCount || 0) + (serviceCount || 0),
      totalSales: ordersCount || 0,
      productCount: productCount || 0,
      serviceCount: serviceCount || 0,
      verified: true
    }
  }
}

// Get products and services by store ID
export async function getStoreProductsAndServices(storeId: string) {
  // Get products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('available', true)
    .order('created_at', { ascending: false })

  if (productsError) throw productsError

  // Get services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('store_id', storeId)
    .eq('available', true)
    .order('created_at', { ascending: false })

  if (servicesError) throw servicesError

  return {
    products: products || [],
    services: services || []
  }
}

