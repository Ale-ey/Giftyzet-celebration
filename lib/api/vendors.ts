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

