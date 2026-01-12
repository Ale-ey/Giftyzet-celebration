import { supabase } from "@/lib/supabase/client"
import type { Product } from "@/types"

export interface Wishlist {
  id: string
  user_id: string
  name: string
  type: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface WishlistItem {
  id: string
  wishlist_id: string
  item_type: "product" | "service"
  product_id: string | null
  service_id: string | null
  created_at: string
  product?: Product
  service?: any
}

export interface CreateWishlistData {
  name: string
  type: string
  is_public?: boolean
}

export interface UpdateWishlistData {
  name?: string
  type?: string
  is_public?: boolean
}

/**
 * Get all wishlists for the current user
 */
export async function getWishlists(): Promise<Wishlist[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("wishlists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get a single wishlist by ID
 */
export async function getWishlistById(wishlistId: string): Promise<Wishlist | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("wishlists")
    .select("*")
    .eq("id", wishlistId)
    .eq("user_id", user.id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null // Not found
    throw error
  }
  return data
}

/**
 * Create a new wishlist
 */
export async function createWishlist(data: CreateWishlistData): Promise<Wishlist> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data: wishlist, error } = await supabase
    .from("wishlists")
    .insert({
      user_id: user.id,
      name: data.name,
      type: data.type,
      is_public: data.is_public || false
    })
    .select()
    .single()

  if (error) throw error
  return wishlist
}

/**
 * Update a wishlist
 */
export async function updateWishlist(
  wishlistId: string,
  data: UpdateWishlistData
): Promise<Wishlist> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data: wishlist, error } = await supabase
    .from("wishlists")
    .update(data)
    .eq("id", wishlistId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) throw error
  return wishlist
}

/**
 * Delete a wishlist
 */
export async function deleteWishlist(wishlistId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("id", wishlistId)
    .eq("user_id", user.id)

  if (error) throw error
}

/**
 * Get all items in a wishlist
 */
export async function getWishlistItems(wishlistId: string): Promise<WishlistItem[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  // Verify wishlist belongs to user
  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, user_id")
    .eq("id", wishlistId)
    .eq("user_id", user.id)
    .single()

  if (!wishlist) throw new Error("Wishlist not found")

  const { data, error } = await supabase
    .from("wishlist_items")
    .select(`
      *,
      product:products(*),
      service:services(*)
    `)
    .eq("wishlist_id", wishlistId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Add a product to a wishlist
 */
export async function addProductToWishlist(
  wishlistId: string,
  productId: string
): Promise<WishlistItem> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  // Verify wishlist belongs to user
  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, user_id")
    .eq("id", wishlistId)
    .eq("user_id", user.id)
    .single()

  if (!wishlist) throw new Error("Wishlist not found")

  const { data: item, error } = await supabase
    .from("wishlist_items")
    .insert({
      wishlist_id: wishlistId,
      item_type: "product",
      product_id: productId
    })
    .select(`
      *,
      product:products(*)
    `)
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new Error("Product already in wishlist")
    }
    throw error
  }
  return item
}

/**
 * Add a service to a wishlist
 */
export async function addServiceToWishlist(
  wishlistId: string,
  serviceId: string
): Promise<WishlistItem> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  // Verify wishlist belongs to user
  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, user_id")
    .eq("id", wishlistId)
    .eq("user_id", user.id)
    .single()

  if (!wishlist) throw new Error("Wishlist not found")

  const { data: item, error } = await supabase
    .from("wishlist_items")
    .insert({
      wishlist_id: wishlistId,
      item_type: "service",
      service_id: serviceId
    })
    .select(`
      *,
      service:services(*)
    `)
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new Error("Service already in wishlist")
    }
    throw error
  }
  return item
}

/**
 * Remove an item from a wishlist
 */
export async function removeWishlistItem(itemId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  // Verify item belongs to user's wishlist
  const { data: item } = await supabase
    .from("wishlist_items")
    .select("wishlist_id, wishlists!inner(user_id)")
    .eq("id", itemId)
    .single()

  if (!item || (item.wishlists as any).user_id !== user.id) {
    throw new Error("Item not found or access denied")
  }

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", itemId)

  if (error) throw error
}

