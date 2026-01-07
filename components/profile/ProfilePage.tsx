"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Lock, MapPin, Phone, Camera, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string>("")

  useEffect(() => {
    // Load user profile from localStorage
    if (typeof window === "undefined") return

    const authData = localStorage.getItem("auth")
    if (!authData) {
      // Redirect to home if not logged in
      router.push("/")
      return
    }

    try {
      const auth = JSON.parse(authData)
      
      // Load extended profile data
      const profileData = localStorage.getItem(`profile_${auth.email}`)
      const savedProfile = profileData ? JSON.parse(profileData) : {}

      setProfile({
        email: auth.email || "",
        name: auth.name || auth.email?.split("@")[0] || "",
        avatar: savedProfile.avatar || "",
        phoneNumber: savedProfile.phoneNumber || "",
        address: savedProfile.address || "",
        password: savedProfile.password || "",
        role: auth.role || "user"
      })

      setAvatarPreview(savedProfile.avatar || "")
    } catch (e) {
      console.error("Error loading profile:", e)
    }
  }, [router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
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

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setAvatarPreview(result)
        setProfile(prev => ({ ...prev, avatar: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validate password change if provided
      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword) {
          alert("Please enter your current password")
          setSaving(false)
          return
        }

        if (!newPassword) {
          alert("Please enter a new password")
          setSaving(false)
          return
        }

        if (newPassword !== confirmPassword) {
          alert("New passwords do not match")
          setSaving(false)
          return
        }

        if (newPassword.length < 6) {
          alert("Password must be at least 6 characters long")
          setSaving(false)
          return
        }

        // In a real app, verify current password with backend
        // For now, we'll just update it
      }

      // Update auth data in localStorage
      const authData = localStorage.getItem("auth")
      if (authData) {
        const auth = JSON.parse(authData)
        const updatedAuth = {
          ...auth,
          name: profile.name
        }
        localStorage.setItem("auth", JSON.stringify(updatedAuth))
      }

      // Save extended profile data
      const profileData = {
        avatar: profile.avatar,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        password: newPassword || profile.password
      }
      localStorage.setItem(`profile_${profile.email}`, JSON.stringify(profileData))

      // Dispatch event to update header
      window.dispatchEvent(new Event("authUpdated"))

      alert("Profile updated successfully!")
      
      // Clear password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
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
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="current-password" className="text-sm font-semibold text-gray-900">
                  Current Password
                </label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-semibold text-gray-900">
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-semibold text-gray-900">
                  Confirm New Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
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
      </div>
    </div>
  )
}

