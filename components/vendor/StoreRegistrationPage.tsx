"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Save, Upload, X, MapPin, Building2, Phone, Mail, Globe, FileText, CreditCard, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { STORE_CATEGORIES } from "@/lib/constants"
import { getCurrentUser, getCurrentUserWithProfile } from "@/lib/api/auth"
import { getVendorByUserId, getStoreByVendorId, createStore, updateStore, createVendor } from "@/lib/api/vendors"
import { uploadStoreLogo } from "@/lib/api/storage"
import { useToast } from "@/components/ui/toast"
import { supabase } from "@/lib/supabase/client"

export default function StoreRegistrationPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeStatus, setStoreStatus] = useState<string | null>(null)
  const [stripeConnected, setStripeConnected] = useState(false)
  const [stripeConnecting, setStripeConnecting] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo_url: ""
  })

  useEffect(() => {
    loadVendorAndStore()
  }, [])

  // Handle return from Stripe Connect onboarding
  useEffect(() => {
    const stripeComplete = searchParams.get("stripe") === "complete"
    const storeIdParam = searchParams.get("store_id")
    if (!stripeComplete || !storeIdParam) return

    const completeOnboarding = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return
        const res = await fetch(
          `/api/stripe/connect/complete?store_id=${encodeURIComponent(storeIdParam)}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        )
        if (res.ok) {
          setStripeConnected(true)
          showToast("Stripe account connected. You can receive payouts after orders are delivered.", "success")
          router.replace("/vendor/register-store", { scroll: false })
        }
      } catch (e) {
        console.error("Stripe complete error:", e)
      }
    }
    completeOnboarding()
  }, [searchParams, router, showToast])

  const loadVendorAndStore = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/")
        return
      }

      // Get user profile to check role
      const userProfile = await getCurrentUserWithProfile()
      if (userProfile?.role !== "vendor") {
        router.push("/")
        return
      }

      let vendor = await getVendorByUserId(user.id)
      
      // If vendor doesn't exist, create it
      if (!vendor) {
        try {
          vendor = await createVendor(user.id, {
            vendor_name: userProfile.name || user.email?.split("@")[0] || "Vendor",
            email: user.email || "",
            business_name: userProfile.name || user.email?.split("@")[0] || "Vendor"
          })
        } catch (createError: any) {
          console.error("Error creating vendor:", createError)
          // If creation fails, still allow form to be shown
          // Vendor might be created by trigger later
        }
      }

      if (vendor) {
        setVendorId(vendor.id)

        // Check if store exists
        const store = await getStoreByVendorId(vendor.id)
        if (store) {
          setStoreId(store.id)
          setStoreStatus(store.status)
          setStripeConnected(!!(store as any).stripe_onboarding_complete || !!(store as any).stripe_account_id)
          setFormData({
            name: store.name || "",
            description: store.description || "",
            category: store.category || "",
            address: store.address || "",
            phone: store.phone || "",
            email: store.email || "",
            website: store.website || "",
            logo_url: store.logo_url || ""
          })
          if (store.logo_url) {
            setLogoPreview(store.logo_url)
          }

          // If store is approved, redirect to dashboard
          if (store.status === "approved") {
            router.push("/vendor")
            return
          }
        }
      } else {
        // Vendor doesn't exist and couldn't be created
        // Still show form, but vendor creation will happen on submit
        showToast("Please complete your vendor profile information", "info")
      }
    } catch (error: any) {
      console.error("Error loading vendor/store:", error)
      // Don't show error, just allow form to be shown
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size should be less than 5MB", "error")
      return
    }

    setLogoFile(file)
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleConnectStripe = async () => {
    if (!storeId) {
      showToast("Save your store first, then connect Stripe.", "info")
      return
    }
    setStripeConnecting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        showToast("Please sign in to connect Stripe.", "error")
        setStripeConnecting(false)
        return
      }
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ storeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || "Failed to start Stripe setup.", "error")
        setStripeConnecting(false)
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      setStripeConnecting(false)
    } catch (e) {
      console.error("Connect Stripe error:", e)
      showToast("Something went wrong. Please try again.", "error")
      setStripeConnecting(false)
    }
  }

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: "" })
    setLogoPreview("")
    setLogoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showToast("Store name is required", "error")
      return
    }

    if (!formData.category) {
      showToast("Please select a category", "error")
      return
    }

    if (!formData.address.trim()) {
      showToast("Warehouse address is required", "error")
      return
    }

    setSaving(true)

    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/")
        return
      }

      let currentVendorId = vendorId

      // Ensure vendor exists
      if (!currentVendorId) {
        try {
          const userProfile = await getCurrentUserWithProfile()
          const vendor = await createVendor(user.id, {
            vendor_name: userProfile?.name || formData.name || user.email?.split("@")[0] || "Vendor",
            email: user.email || formData.email || "",
            business_name: formData.name || userProfile?.name || "Vendor"
          })
          currentVendorId = vendor.id
          setVendorId(vendor.id)
        } catch (createError: any) {
          console.error("Error creating vendor:", createError)
          showToast("Failed to create vendor profile. Please try again.", "error")
          setSaving(false)
          return
        }
      }

      let logoUrl = formData.logo_url

      // Upload logo if new file is selected
      if (logoFile && currentVendorId) {
        try {
          logoUrl = await uploadStoreLogo(logoFile, currentVendorId)
        } catch (uploadError: any) {
          console.error("Logo upload error:", uploadError)
          showToast("Failed to upload logo. Continuing without logo...", "warning")
        }
      }

      const storeData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        address: formData.address,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        logo_url: logoUrl || undefined,
        status: "pending" as const
      }

      if (storeId) {
        // Update existing store
        await updateStore(storeId, storeData)
        setStoreStatus("pending")
        showToast("Store registration updated successfully. Waiting for admin approval.", "success")
      } else {
        // Create new store
        if (!currentVendorId) {
          showToast("Vendor ID is missing. Please try again.", "error")
          setSaving(false)
          return
        }
        const newStore = await createStore(currentVendorId, storeData)
        setStoreId(newStore.id)
        setStoreStatus("pending")
        showToast("Store registration submitted successfully. Waiting for admin approval.", "success")
      }

      // Reload store data to show status
      await loadVendorAndStore()
    } catch (error: any) {
      console.error("Error saving store:", error)
      showToast(error.message || "Failed to submit store registration", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Register Your Store</h1>
            <p className="text-gray-600">
              Complete your store information to start selling on GiftyZel. Your registration will be reviewed by our admin team.
            </p>
          </div>

          {/* Store Status Banner */}
          {storeStatus && (
            <Card className={`mb-6 border-2 ${
              storeStatus === "pending" 
                ? "border-yellow-300 bg-yellow-50" 
                : storeStatus === "rejected"
                ? "border-red-300 bg-red-50"
                : "border-green-300 bg-green-50"
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {storeStatus === "pending" && "Store Registration Pending"}
                      {storeStatus === "rejected" && "Store Registration Rejected"}
                      {storeStatus === "approved" && "Store Registration Approved"}
                    </h3>
                    <p className="text-sm text-gray-700">
                      {storeStatus === "pending" && "Your store registration is under review. You will be notified once it's approved."}
                      {storeStatus === "rejected" && "Your store registration was rejected. Please update your information and resubmit."}
                      {storeStatus === "approved" && "Your store has been approved! You can now manage your products and orders."}
                    </p>
                  </div>
                  {storeStatus === "approved" && (
                    <Button
                      onClick={() => router.push("/vendor")}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      Go to Dashboard
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Store Information</CardTitle>
              <CardDescription className="text-gray-600">
                Provide complete details about your store. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Store Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-gray-900 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Store Name *
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your store name"
                    required
                    className="bg-white border-gray-200 text-gray-900"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-semibold text-gray-900 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Store Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Describe your store, products, and services..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-semibold text-gray-900">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a category</option>
                    {STORE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Warehouse Address */}
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-semibold text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Warehouse Address *
                  </label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    placeholder="Enter complete warehouse address including street, city, state, and zip code"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500">This address will be used for order fulfillment and shipping.</p>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-semibold text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="store@example.com"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm font-semibold text-gray-900 flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Website (Optional)
                  </label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.example.com"
                    className="bg-white border-gray-200 text-gray-900"
                  />
                </div>

                {/* Stripe payout account */}
                {storeId && (
                  <Card className="border border-gray-200 bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-gray-900 flex items-center gap-2 text-base">
                        <CreditCard className="h-4 w-4" />
                        Stripe payout account
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Connect your Stripe account to receive payouts. After an order is marked delivered, your share (after platform commission) is transferred to your Stripe account 7 days later.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stripeConnected ? (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">Stripe account connected</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleConnectStripe}
                          disabled={stripeConnecting}
                          variant="outline"
                          className="border-gray-300 bg-white text-gray-700"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {stripeConnecting ? "Redirecting..." : "Connect Stripe account"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Store Logo */}
                <div className="space-y-2">
                  <label htmlFor="logo" className="text-sm font-semibold text-gray-900">
                    Store Logo
                  </label>
                  
                  {/* Logo Preview */}
                  {logoPreview && (
                    <div className="mb-4 relative inline-block">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </Button>
                    {logoPreview && (
                      <span className="text-sm text-gray-600">Logo ready to upload</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload an image file (max 5MB). Supported formats: JPG, PNG, GIF. Recommended size: 512x512px
                  </p>
                </div>

                {/* Submit Button */}
                {storeStatus !== "approved" && (
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Submitting..." : storeId ? "Update Registration" : "Submit Registration"}
                    </Button>
                  </div>
                )}

                {storeStatus === "pending" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Your store registration is currently pending review. 
                      You can update your information if needed. Our admin team will review your application within 1-2 business days.
                    </p>
                  </div>
                )}

                {storeStatus === "rejected" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                      <strong>Note:</strong> Your store registration was rejected. Please review and update your information, then resubmit for approval.
                    </p>
                  </div>
                )}

                {!storeStatus && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> After submitting your store registration, our admin team will review your application. 
                      You will be notified once your store is approved. This process typically takes 1-2 business days.
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

