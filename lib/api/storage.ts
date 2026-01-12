import { supabase } from '../supabase/client'

// Upload image to Supabase Storage
export async function uploadImage(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}

// Delete image from Supabase Storage
export async function deleteImage(bucket: string, path: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) throw error
}

// Upload avatar
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return uploadImage(file, 'avatars', userId)
}

// Upload product image
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  return uploadImage(file, 'products', productId)
}

// Upload service image
export async function uploadServiceImage(file: File, serviceId: string): Promise<string> {
  return uploadImage(file, 'services', serviceId)
}

// Upload store logo
export async function uploadStoreLogo(file: File, storeId: string): Promise<string> {
  return uploadImage(file, 'stores', `${storeId}/logo`)
}

// Upload store banner
export async function uploadStoreBanner(file: File, storeId: string): Promise<string> {
  return uploadImage(file, 'stores', `${storeId}/banner`)
}

