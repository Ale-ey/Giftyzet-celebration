import { supabase } from '../supabase/client'

export interface ProductData {
  name: string
  description?: string
  price: number
  original_price?: number
  category: string
  stock?: number
  available?: boolean
}

export interface ServiceData {
  name: string
  description?: string
  price: number
  original_price?: number
  category: string
  location?: string
  available?: boolean
}

// ============================================
// IMAGE UPLOAD
// ============================================

export async function uploadProductImage(file: File, storeId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${storeId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function uploadServiceImage(file: File, storeId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${storeId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('services')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('services')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function deleteImage(imageUrl: string): Promise<void> {
  // Extract bucket and file path from URL
  // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  
  let bucketName = ''
  let filePath = ''
  
  if (imageUrl.includes('/products/')) {
    bucketName = 'products'
    const urlParts = imageUrl.split('/products/')
    if (urlParts.length >= 2) filePath = urlParts[1]
  } else if (imageUrl.includes('/services/')) {
    bucketName = 'services'
    const urlParts = imageUrl.split('/services/')
    if (urlParts.length >= 2) filePath = urlParts[1]
  }
  
  if (!bucketName || !filePath) {
    console.error('Could not parse image URL:', imageUrl)
    return
  }
  
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([filePath])

  if (error) console.error('Error deleting image:', error)
}

// ============================================
// PRODUCTS
// ============================================

// Create product
export async function createProduct(storeId: string, productData: ProductData, imageFiles?: File[]) {
  let imageUrls: string[] = []
  
  // Upload all images if provided
  if (imageFiles && imageFiles.length > 0) {
    for (const file of imageFiles) {
      const url = await uploadProductImage(file, storeId)
      imageUrls.push(url)
    }
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      store_id: storeId,
      ...productData,
      image_url: imageUrls[0] || null, // First image as main image
      images: imageUrls.length > 0 ? imageUrls : null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update product
export async function updateProduct(productId: string, productData: Partial<ProductData>, imageFiles?: File[], storeId?: string) {
  let imageUrls: string[] | undefined = undefined
  
  // Upload new images if provided
  if (imageFiles && imageFiles.length > 0 && storeId) {
    imageUrls = []
    for (const file of imageFiles) {
      const url = await uploadProductImage(file, storeId)
      imageUrls.push(url)
    }
  }

  const updateData: any = { ...productData }
  if (imageUrls && imageUrls.length > 0) {
    updateData.image_url = imageUrls[0] // First image as main image
    updateData.images = imageUrls
  }

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete product
export async function deleteProduct(productId: string) {
  // Get product to delete images
  const { data: product } = await supabase
    .from('products')
    .select('image_url, images')
    .eq('id', productId)
    .single()

  // Delete all images if exist
  if (product?.images && Array.isArray(product.images)) {
    for (const imageUrl of product.images) {
      await deleteImage(imageUrl)
    }
  } else if (product?.image_url) {
    // Fallback for old products with single image
    await deleteImage(product.image_url)
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) throw error
}

// Get products by store
export async function getProductsByStore(storeId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get rating and reviews_count from reviews table (source of truth for display)
async function getProductRatingFromReviews(productId: string): Promise<{ rating: number; reviews_count: number }> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)

  if (error) return { rating: 0, reviews_count: 0 }
  const list = data || []
  if (list.length === 0) return { rating: 0, reviews_count: 0 }
  const sum = list.reduce((s, r) => s + Number(r.rating), 0)
  const rating = Math.round((sum / list.length) * 10) / 10
  return { rating, reviews_count: list.length }
}

async function getServiceRatingFromReviews(serviceId: string): Promise<{ rating: number; reviews_count: number }> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('service_id', serviceId)

  if (error) return { rating: 0, reviews_count: 0 }
  const list = data || []
  if (list.length === 0) return { rating: 0, reviews_count: 0 }
  const sum = list.reduce((s, r) => s + Number(r.rating), 0)
  const rating = Math.round((sum / list.length) * 10) / 10
  return { rating, reviews_count: list.length }
}

// Get single product (rating and reviews_count computed from reviews table)
export async function getProduct(productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      stores (
        id,
        name,
        vendors (
          vendor_name
        )
      )
    `)
    .eq('id', productId)
    .single()

  if (error) throw error
  const fromReviews = await getProductRatingFromReviews(productId)
  return {
    ...data,
    rating: fromReviews.rating,
    reviews_count: fromReviews.reviews_count,
  }
}

// Get all approved products (for marketplace)
export async function getApprovedProducts(limit?: number) {
  let query = supabase
    .from('products')
    .select(`
      *,
      stores!inner (
        id,
        name,
        status,
        vendors (
          vendor_name
        )
      )
    `)
    .eq('stores.status', 'approved')
    .eq('available', true)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// ============================================
// SERVICES
// ============================================

// Create service
export async function createService(storeId: string, serviceData: ServiceData, imageFiles?: File[]) {
  let imageUrls: string[] = []
  
  // Upload all images if provided
  if (imageFiles && imageFiles.length > 0) {
    for (const file of imageFiles) {
      const url = await uploadServiceImage(file, storeId)
      imageUrls.push(url)
    }
  }

  const { data, error } = await supabase
    .from('services')
    .insert({
      store_id: storeId,
      ...serviceData,
      image_url: imageUrls[0] || null, // First image as main image
      images: imageUrls.length > 0 ? imageUrls : null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update service
export async function updateService(serviceId: string, serviceData: Partial<ServiceData>, imageFiles?: File[], storeId?: string) {
  let imageUrls: string[] | undefined = undefined
  
  // Upload new images if provided
  if (imageFiles && imageFiles.length > 0 && storeId) {
    imageUrls = []
    for (const file of imageFiles) {
      const url = await uploadServiceImage(file, storeId)
      imageUrls.push(url)
    }
  }

  const updateData: any = { ...serviceData }
  if (imageUrls && imageUrls.length > 0) {
    updateData.image_url = imageUrls[0] // First image as main image
    updateData.images = imageUrls
  }

  const { data, error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', serviceId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete service
export async function deleteService(serviceId: string) {
  // Get service to delete images
  const { data: service } = await supabase
    .from('services')
    .select('image_url, images')
    .eq('id', serviceId)
    .single()

  // Delete all images if exist
  if (service?.images && Array.isArray(service.images)) {
    for (const imageUrl of service.images) {
      await deleteImage(imageUrl)
    }
  } else if (service?.image_url) {
    // Fallback for old services with single image
    await deleteImage(service.image_url)
  }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)

  if (error) throw error
}

// Get services by store
export async function getServicesByStore(storeId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get single service (rating and reviews_count computed from reviews table)
export async function getService(serviceId: string) {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      stores (
        id,
        name,
        vendors (
          vendor_name
        )
      )
    `)
    .eq('id', serviceId)
    .single()

  if (error) throw error
  const fromReviews = await getServiceRatingFromReviews(serviceId)
  return {
    ...data,
    rating: fromReviews.rating,
    reviews_count: fromReviews.reviews_count,
  }
}

// Get all approved services (for marketplace)
export async function getApprovedServices(limit?: number) {
  let query = supabase
    .from('services')
    .select(`
      *,
      stores!inner (
        id,
        name,
        status,
        vendors (
          vendor_name
        )
      )
    `)
    .eq('stores.status', 'approved')
    .eq('available', true)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}
