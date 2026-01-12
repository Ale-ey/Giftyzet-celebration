# Profile API Documentation

Complete profile management APIs for getting, setting, and updating user profiles.

## 📋 Overview

The Profile API provides comprehensive functions for managing user profiles including:
- Getting profiles (current user or by ID)
- Setting/creating profiles
- Updating profiles
- Avatar upload and management
- Profile search and batch operations

## 🔧 API Functions

### Get Profile

#### `getProfile(userId: string): Promise<FullProfile>`
Get a user's profile by their user ID.

```typescript
import { getProfile } from '@/lib/api/profile'

const profile = await getProfile('user-uuid-here')
console.log(profile.name, profile.email, profile.avatar_url)
```

#### `getCurrentProfile(): Promise<FullProfile | null>`
Get the currently authenticated user's profile.

```typescript
import { getCurrentProfile } from '@/lib/api/profile'

const profile = await getCurrentProfile()
if (profile) {
  console.log('Current user:', profile.name)
}
```

#### `getProfileWithAuth()`
Get current user's profile combined with auth user data.

```typescript
import { getProfileWithAuth } from '@/lib/api/profile'

const userWithProfile = await getProfileWithAuth()
// Returns: { id, email, name, role, avatar_url, phone_number, address, ... }
```

### Set/Create Profile

#### `setProfile(userId: string, profileData: ProfileData): Promise<FullProfile>`
Create or update a profile (upsert operation). If profile exists, it updates; if not, it creates.

```typescript
import { setProfile } from '@/lib/api/profile'

const profile = await setProfile(userId, {
  name: 'John Doe',
  phone_number: '+1234567890',
  address: '123 Main St',
  avatar_url: 'https://...'
})
```

### Update Profile

#### `updateProfile(userId: string, profileData: Partial<ProfileData>): Promise<FullProfile>`
Update a user's profile by user ID. Only the authenticated user can update their own profile.

```typescript
import { updateProfile } from '@/lib/api/profile'

const updated = await updateProfile(userId, {
  name: 'Jane Doe',
  phone_number: '+0987654321'
})
```

#### `updateCurrentProfile(profileData: Partial<ProfileData>): Promise<FullProfile>`
Update the current user's profile (convenience function).

```typescript
import { updateCurrentProfile } from '@/lib/api/profile'

const updated = await updateCurrentProfile({
  name: 'Jane Doe',
  address: '456 New St'
})
```

### Avatar Management

#### `uploadAvatarAndUpdateProfile(file: File, userId?: string): Promise<FullProfile>`
Upload an avatar image to Supabase Storage and update the profile.

```typescript
import { uploadAvatarAndUpdateProfile } from '@/lib/api/profile'

const fileInput = document.querySelector('input[type="file"]')
const file = fileInput.files[0]

const updated = await uploadAvatarAndUpdateProfile(file)
console.log('New avatar URL:', updated.avatar_url)
```

#### `deleteAvatar(userId?: string): Promise<FullProfile>`
Remove avatar from profile.

```typescript
import { deleteAvatar } from '@/lib/api/profile'

const updated = await deleteAvatar()
// Avatar URL is now null
```

### Utility Functions

#### `profileExists(userId: string): Promise<boolean>`
Check if a profile exists for a user.

```typescript
import { profileExists } from '@/lib/api/profile'

const exists = await profileExists(userId)
if (!exists) {
  // Create profile
}
```

#### `getProfiles(userIds: string[]): Promise<FullProfile[]>`
Get multiple profiles by user IDs (batch operation).

```typescript
import { getProfiles } from '@/lib/api/profile'

const profiles = await getProfiles(['user1-id', 'user2-id', 'user3-id'])
profiles.forEach(profile => {
  console.log(profile.name)
})
```

#### `searchProfiles(query: string, limit?: number): Promise<FullProfile[]>`
Search profiles by name or email.

```typescript
import { searchProfiles } from '@/lib/api/profile'

const results = await searchProfiles('john', 10)
results.forEach(profile => {
  console.log(profile.name, profile.email)
})
```

## 📝 Type Definitions

### `ProfileData`
```typescript
interface ProfileData {
  name?: string
  phone_number?: string
  address?: string
  avatar_url?: string
}
```

### `FullProfile`
```typescript
interface FullProfile extends ProfileData {
  id: string
  email: string
  role: 'user' | 'vendor' | 'admin'
  created_at?: string
  updated_at?: string
}
```

## 💡 Usage Examples

### Complete Profile Update Flow

```typescript
import { 
  getCurrentProfile, 
  updateCurrentProfile, 
  uploadAvatarAndUpdateProfile 
} from '@/lib/api/profile'

// 1. Get current profile
const profile = await getCurrentProfile()

// 2. Update basic info
await updateCurrentProfile({
  name: 'John Doe',
  phone_number: '+1234567890',
  address: '123 Main St'
})

// 3. Upload avatar
const file = // ... get file from input
await uploadAvatarAndUpdateProfile(file)

// 4. Refresh profile
const updated = await getCurrentProfile()
```

### Profile Form Component Example

```typescript
'use client'

import { useState } from 'react'
import { getCurrentProfile, updateCurrentProfile } from '@/lib/api/profile'

export default function ProfileForm() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const data = await getCurrentProfile()
    setProfile(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateCurrentProfile({
        name: profile.name,
        phone_number: profile.phone_number,
        address: profile.address
      })
      alert('Profile updated!')
    } catch (error) {
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Avatar Upload Example

```typescript
import { uploadAvatarAndUpdateProfile } from '@/lib/api/profile'

const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Validate file
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image must be less than 5MB')
    return
  }

  try {
    const updated = await uploadAvatarAndUpdateProfile(file)
    setAvatarUrl(updated.avatar_url)
    alert('Avatar updated!')
  } catch (error) {
    alert('Failed to upload avatar')
  }
}
```

## 🔒 Security

- **Authorization**: Users can only update their own profiles
- **Validation**: File size and type validation for avatars
- **RLS Policies**: Row Level Security ensures data isolation
- **Error Handling**: All functions throw errors that should be caught

## ⚠️ Error Handling

All functions throw errors that should be caught:

```typescript
try {
  const profile = await getCurrentProfile()
} catch (error) {
  if (error.message.includes('Not authenticated')) {
    // Redirect to login
  } else {
    // Show error message
    console.error('Profile error:', error)
  }
}
```

## 🚀 Integration with Auth API

The profile functions are also exported from `@/lib/api/auth` for convenience:

```typescript
import { 
  getCurrentProfile, 
  updateCurrentProfile 
} from '@/lib/api/auth'
```

This allows you to import both auth and profile functions from the same module.

## 📚 Related APIs

- **Auth API** (`lib/api/auth.ts`) - Authentication functions
- **Storage API** (`lib/api/storage.ts`) - File upload functions
- **Vendor API** (`lib/api/vendors.ts`) - Vendor-specific profile functions

## ✅ Best Practices

1. **Always check authentication** before calling profile functions
2. **Handle errors gracefully** with try-catch blocks
3. **Validate input** before updating profiles
4. **Show loading states** during async operations
5. **Update UI** after successful operations
6. **Use `updateCurrentProfile`** instead of `updateProfile` when updating own profile

