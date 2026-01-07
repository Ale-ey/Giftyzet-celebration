import { supabase } from '../supabase/client'

export interface ProductData {
  store_id: string
  name: string
  description?: string
  price: number
  original_price?: number
  category: string
  image_url?: string
  images?: string[]
  stock?: number
  available?: boolean
}

export interface ServiceData {
  store_id: string
  name: string
  description?: string
  price: number
  original_price?: number
  category: string
  image_url?: string
  images?: string[]
  duration?: string
  location?: string
  available?: boolean
}

// Products
export async function createProduct(productData: ProductData) {
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProduct(productId: string, productData: Partial<ProductData>) {
  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProduct(productId: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) throw error
}

export async function getProductsByStore(storeId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getProducts(category?: string, limit?: number) {
  let query = supabase
    .from('products')
    .select(`
      *,
      stores (
        id,
        name,
        logo_url,
        vendors (
          id,
          vendor_name
        )
      )
    `)
    .eq('available', true)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Services
export async function createService(serviceData: ServiceData) {
  const { data, error } = await supabase
    .from('services')
    .insert(serviceData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateService(serviceId: string, serviceData: Partial<ServiceData>) {
  const { data, error } = await supabase
    .from('services')
    .update(serviceData)
    .eq('id', serviceId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteService(serviceId: string) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)

  if (error) throw error
}

export async function getServicesByStore(storeId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getServices(category?: string, limit?: number) {
  let query = supabase
    .from('services')
    .select(`
      *,
      stores (
        id,
        name,
        logo_url,
        vendors (
          id,
          vendor_name
        )
      )
    `)
    .eq('available', true)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

