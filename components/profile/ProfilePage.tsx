"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Lock, MapPin, Phone, Camera, Save, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import ChangePasswordModal from "./ChangePasswordModal"
import LogoutConfirmationModal from "./LogoutConfirmationModal"
import { 
  getCurrentUserWithProfile, 
  signOut, 
  updateCurrentProfile, 
  uploadAvatarAndUpdateProfile,
  getCurrentProfile
} from "@/lib/api/auth"

interface UserProfile {
  email: string
  name: string
  avatar?: string
  phoneNumber?: string
  address?: string
  password?: string
  role?: "user" | "admin" | "vendor"
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    email: "",
    name: "",
    avatar: "",
    phoneNumber: "",
    address: "",
    password: "",
    role: "user"
  })
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [signingOut, setSigningOut] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    // Load user profile from Supabase
    const loadProfile = async () => {
      setLoading(true)
      try {
        // Wait a bit for auth session to be established after login
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const userProfile = await getCurrentProfile()
        
        if (userProfile) {
          // Profile exists - load it with pre-filled data
          setProfile({
            email: userProfile.email || "",
            name: userProfile.name || userProfile.email?.split("@")[0] || "",
            avatar: userProfile.avatar_url || "",
            phoneNumber: userProfile.phone_number || "",
            address: userProfile.address || "",
            role: (userProfile.role as "user" | "admin" | "vendor") || "user"
          })
          setAvatarPreview(userProfile.avatar_url || "")
        } else {
          // Profile doesn't exist - check if user is authenticated
          const { getCurrentUser } = await import("@/lib/api/auth")
          const user = await getCurrentUser()
          
          if (user) {
            // User is authenticated but profile doesn't exist - show form with email/name pre-filled
            // Profile will be created when user saves
            setProfile({
              email: user.email || "",
              name: user.user_metadata?.name || user.email?.split("@")[0] || "",
              avatar: "",
              phoneNumber: "",
              address: "",
              role: "user"
            })
            setAvatarPreview("")
          } else {
            // Not authenticated - redirect to home
            router.push("/")
            return
          }
        }
      } catch (e: any) {
        console.error("Error loading profile:", e)
        // Check if it's an auth error
        if (e?.message?.includes("JWT") || e?.message?.includes("authentication") || e?.code === "PGRST301") {
          // Auth error - redirect to home
          router.push("/")
          return
        }
        
        // For other errors (like RLS), try to get user from auth and show form
        try {
          const { getCurrentUser } = await import("@/lib/api/auth")
          const user = await getCurrentUser()
          if (user) {
            // Show form with email pre-filled even if profile load failed
            setProfile({
              email: user.email || "",
              name: user.user_metadata?.name || user.email?.split("@")[0] || "",
              avatar: "",
              phoneNumber: "",
              address: "",
              role: "user"
            })
          } else {
            router.push("/")
          }
        } catch (authError) {
          router.push("/")
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    // Create preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setAvatarPreview(result)
      setProfile(prev => ({ ...prev, avatar: result }))
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage and update profile
    try {
      setSaving(true)
      const updatedProfile = await uploadAvatarAndUpdateProfile(file)
      setProfile(prev => ({
        ...prev,
        avatar: updatedProfile.avatar_url || ""
      }))
      setAvatarPreview(updatedProfile.avatar_url || "")
      window.dispatchEvent(new Event("authUpdated"))
      showToast("Avatar updated successfully!", "success")
    } catch (error: any) {
      console.error("Error uploading avatar:", error)
      showToast(`Failed to upload avatar: ${error.message || "Please try again."}`, "error")
      // Revert preview on error
      const currentProfile = await getCurrentProfile()
      if (currentProfile) {
        setAvatarPreview(currentProfile.avatar_url || "")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { getCurrentUser } = await import("@/lib/api/auth")
      const user = await getCurrentUser()
      if (!user) {
        router.push("/")
        return
      }

      // Check if profile exists
      let currentProfile
      try {
        currentProfile = await getCurrentProfile()
      } catch (e) {
        // Profile doesn't exist - will create it
        currentProfile = null
      }

      if (currentProfile) {
        // Update existing profile
        await updateCurrentProfile({
          name: profile.name,
          phone_number: profile.phoneNumber || undefined,
          address: profile.address || undefined,
          // Don't update avatar_url here if it's a base64 string (already uploaded)
          // Only update if it's a URL
          ...(profile.avatar && profile.avatar.startsWith('http') 
            ? { avatar_url: profile.avatar } 
            : {})
        })
      } else {
        // Create new profile
        const { setProfile: createProfile } = await import("@/lib/api/profile")
        await createProfile(user.id, {
          name: profile.name,
          email: profile.email || user.email || "",
          phone_number: profile.phoneNumber || undefined,
          address: profile.address || undefined,
          avatar_url: profile.avatar && profile.avatar.startsWith('http') ? profile.avatar : undefined
        })
      }

      // Dispatch event to update header
      window.dispatchEvent(new Event("authUpdated"))

      showToast("Profile updated successfully!", "success")
    } catch (error: any) {
      console.error("Error saving profile:", error)
      showToast(`Failed to update profile: ${error.message || "Please try again."}`, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleSignOutClick = () => {
    setIsLogoutModalOpen(true)
  }

  const handleSignOutConfirm = async () => {
    try {
      setSigningOut(true)
      await signOut()
      setIsLogoutModalOpen(false)
      showToast("Signed out successfully", "success")
      // Small delay to show toast before redirect
      setTimeout(() => {
        router.push("/")
      }, 500)
    } catch (error: any) {
      console.error("Sign out error:", error)
      showToast(`Failed to sign out: ${error.message || "Please try again."}`, "error")
      setIsLogoutModalOpen(false)
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-2 border-gray-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-900">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-200">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    <Camera className="h-5 w-5" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600">Click the camera icon to change your profile picture</p>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                  required
                />
              </div>

              {/* Email Field (Disabled) */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-900 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-semibold text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={profile.phoneNumber}
                  onChange={(e) => setProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full"
                />
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  Address
                </label>
                <textarea
                  id="address"
                  placeholder="Enter your address"
                  value={profile.address}
                  onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full min-h-[100px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* Password Change Section */}
          <Card className="border-2 border-gray-100 bg-white shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Change your password to keep your account secure.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsChangePasswordModalOpen(true)}
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOutClick}
              disabled={signingOut}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-8 py-3 font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
        />

        {/* Logout Confirmation Modal */}
        <LogoutConfirmationModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleSignOutConfirm}
          loading={signingOut}
        />
      </div>
    </div>
  )
}

