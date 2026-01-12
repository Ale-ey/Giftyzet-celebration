import { supabase } from '../supabase/client'
import { uploadAvatar } from './storage'

export interface ProfileData {
  name?: string
  phone_number?: string
  address?: string
  avatar_url?: string
}

export interface FullProfile extends ProfileData {
  id: string
  email: string
  role: 'user' | 'vendor' | 'admin'
  created_at?: string
  updated_at?: string
}

/**
 * Get user profile by user ID
 * @param userId - The user ID to fetch profile for
 * @returns User profile data
 */
export async function getProfile(userId: string): Promise<FullProfile> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as FullProfile
}

/**
 * Get current user's profile
 * @returns Current user's profile data or null if not authenticated
 */
export async function getCurrentProfile(): Promise<FullProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return getProfile(user.id)
}

/**
 * Get profile with auth user data combined
 * @returns Combined auth user and profile data
 */
export async function getProfileWithAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const profile = await getProfile(user.id)
  
  return {
    ...user,
    ...profile
  }
}

/**
 * Create or set user profile (upsert)
 * If profile exists, it updates; if not, it creates
 * @param userId - The user ID
 * @param profileData - Profile data to set
 * @returns Created/updated profile
 */
export async function setProfile(userId: string, profileData: ProfileData & { email?: string }): Promise<FullProfile> {
  // Check if profile exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) {
    // Update existing profile
    return updateProfile(userId, profileData)
  } else {
    // Create new profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      throw new Error('Unauthorized: Cannot create profile for different user')
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: profileData.email || user.email || '',
        name: profileData.name || user.email?.split('@')[0] || '',
        role: 'user', // Default role
        ...profileData
      })
      .select()
      .single()

    if (error) throw error
    return data as FullProfile
  }
}

/**
 * Update user profile
 * @param userId - The user ID to update
 * @param profileData - Profile data to update (partial)
 * @returns Updated profile
 */
export async function updateProfile(userId: string, profileData: Partial<ProfileData>): Promise<FullProfile> {
  // Verify user can only update their own profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: Cannot update profile for different user')
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as FullProfile
}

/**
 * Update current user's profile
 * @param profileData - Profile data to update (partial)
 * @returns Updated profile
 */
export async function updateCurrentProfile(profileData: Partial<ProfileData>): Promise<FullProfile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  return updateProfile(user.id, profileData)
}

/**
 * Upload avatar and update profile
 * @param file - Image file to upload
 * @param userId - User ID (optional, defaults to current user)
 * @returns Updated profile with new avatar URL
 */
export async function uploadAvatarAndUpdateProfile(
  file: File,
  userId?: string
): Promise<FullProfile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const targetUserId = userId || user.id

  // Upload avatar to Supabase Storage
  const avatarUrl = await uploadAvatar(file, targetUserId)

  // Update profile with new avatar URL
  return updateProfile(targetUserId, { avatar_url: avatarUrl })
}

/**
 * Delete avatar from profile
 * @param userId - User ID (optional, defaults to current user)
 * @returns Updated profile
 */
export async function deleteAvatar(userId?: string): Promise<FullProfile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const targetUserId = userId || user.id

  // Update profile to remove avatar URL
  return updateProfile(targetUserId, { avatar_url: undefined })
}

/**
 * Check if profile exists
 * @param userId - User ID to check
 * @returns True if profile exists, false otherwise
 */
export async function profileExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // No rows returned
    return false
  }

  return !!data
}

/**
 * Get multiple profiles by user IDs
 * @param userIds - Array of user IDs
 * @returns Array of profiles
 */
export async function getProfiles(userIds: string[]): Promise<FullProfile[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds)

  if (error) throw error
  return data as FullProfile[]
}

/**
 * Search profiles by name or email
 * @param query - Search query
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of matching profiles
 */
export async function searchProfiles(query: string, limit: number = 10): Promise<FullProfile[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(limit)

  if (error) throw error
  return data as FullProfile[]
}

