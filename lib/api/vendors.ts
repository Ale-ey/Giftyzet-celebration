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

