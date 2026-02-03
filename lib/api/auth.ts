import { supabase } from '../supabase/client'

export interface SignUpData {
  email: string
  password: string
  name?: string
  role?: 'user' | 'vendor' | 'admin'
}

export interface SignInData {
  email: string
  password: string
}

export interface UserProfile {
  name?: string
  phone_number?: string
  address?: string
  avatar_url?: string
}

// Re-export profile functions for convenience
export {
  getProfile,
  getCurrentProfile,
  getProfileWithAuth,
  setProfile,
  updateProfile,
  updateCurrentProfile,
  uploadAvatarAndUpdateProfile,
  deleteAvatar,
  profileExists,
  getProfiles,
  searchProfiles,
  type ProfileData,
  type FullProfile
} from './profile'

// Sign up
export async function signUp(data: SignUpData & { vendor_name?: string }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name || data.email.split('@')[0],
        role: data.role || 'user',
        ...(data.vendor_name && { vendor_name: data.vendor_name }),
      },
      emailRedirectTo: (() => {
        const base = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        const normalized = typeof base === 'string' ? base.replace(/\/+$/, '') : ''
        return `${normalized || 'http://localhost:3000'}/auth/callback`
      })()
    }
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Failed to create user')

  // Check if email confirmation is required
  const needsEmailConfirmation = authData.user && !authData.session

  // Profile should be automatically created by database trigger
  // If trigger doesn't exist, try to create profile manually with retries
  let profileCreated = false
  let retries = 3
  
  while (!profileCreated && retries > 0) {
    try {
      // Wait a bit for trigger to execute or session to establish
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (existingProfile) {
        // Profile exists, update it with any additional data
        await supabase
          .from('users')
          .update({
            name: data.name || data.email.split('@')[0],
            role: data.role || 'user',
          })
          .eq('id', authData.user.id)
        profileCreated = true
      } else if (!checkError) {
        // Profile doesn't exist, try to create it
        // Wait a bit more for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            name: data.name || data.email.split('@')[0],
            role: data.role || 'user',
          })

        if (!profileError) {
          profileCreated = true
        } else {
          console.warn(`Profile creation attempt ${4 - retries} failed:`, profileError)
          retries--
        }
      } else {
        retries--
      }
    } catch (error) {
      console.warn('Profile creation error:', error)
      retries--
    }
  }

  if (!profileCreated) {
    console.warn('Profile was not created automatically. It may be created by trigger or can be created on first login.')
    // Don't throw - user was created successfully, profile can be created later
  }

  return {
    ...authData,
    needsEmailConfirmation
  }
}

// Sign in
export async function signIn(data: SignInData) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) throw error
  return authData
}

// Sign out - clears all user data
export async function signOut() {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    // Clear all local storage data regardless of Supabase sign out result
    if (typeof window !== 'undefined') {
      // Clear auth-related localStorage items
      localStorage.removeItem('auth')
      
      // Clear cart (optional - you might want to keep cart for guest users)
      // localStorage.removeItem('cart')
      
      // Clear any other user-specific data
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('profile_') || key.startsWith('gift_'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Dispatch event to notify components
      window.dispatchEvent(new Event('authUpdated'))
      window.dispatchEvent(new Event('cartUpdated'))
    }
    
    // If Supabase sign out had an error, log it but don't throw
    // (local storage is already cleared, so logout is effectively complete)
    if (error) {
      console.warn('Supabase sign out error (local data cleared):', error)
      // Don't throw - logout is still successful from user perspective
    }
  } catch (error) {
    // If there's any other error, still try to clear local storage
    console.error('Sign out error:', error)
    
    // Clear local storage even if there's an error
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('auth')
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('profile_') || key.startsWith('gift_'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        window.dispatchEvent(new Event('authUpdated'))
        window.dispatchEvent(new Event('cartUpdated'))
      } catch (clearError) {
        console.error('Error clearing local storage:', clearError)
      }
    }
    
    // Re-throw only if we couldn't clear local storage
    throw error
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
}

// Update user profile (deprecated - use updateProfile from profile.ts instead)
export async function updateUserProfile(userId: string, profile: UserProfile) {
  const { updateProfile } = await import('./profile')
  return updateProfile(userId, profile)
}

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get current user with profile (including role)
export async function getCurrentUserWithProfile() {
  const { getProfileWithAuth } = await import('./profile')
  return getProfileWithAuth()
}

