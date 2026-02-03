"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Save, ArrowLeft, Upload, X, CreditCard, CheckCircle2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCurrentUser } from "@/lib/api/auth"
import { getVendorByUserId, getStoreByVendorId, updateStore } from "@/lib/api/vendors"
import { uploadStoreLogo } from "@/lib/api/storage"
import { STORE_CATEGORIES } from "@/lib/constants"
import { useToast } from "@/components/ui/toast"
import { supabase } from "@/lib/supabase/client"

export default function VendorStoreSetup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stripeConnected, setStripeConnected] = useState(false)
  const [stripeConnecting, setStripeConnecting] = useState(false)
  const [stripeDisconnecting, setStripeDisconnecting] = useState(false)
  const [stripeDashboardOpening, setStripeDashboardOpening] = useState(false)
  const [initialLogoUrl, setInitialLogoUrl] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    email: "",
    website: ""
  })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [needsRegistration, setNeedsRegistration] = useState(false)
  const [notSignedIn, setNotSignedIn] = useState(false)

  // Load store from backend and fill form; also listen to auth so we run when session is ready
  useEffect(() => {
    let cancelled = false

    async function loadStoreWithUser(user: { id: string }) {
      if (cancelled) return
      setLoadError(null)
      setNeedsRegistration(false)
      setNotSignedIn(false)
      try {
        const vendor = await getVendorByUserId(user.id)
        if (!vendor || cancelled) {
          setNeedsRegistration(true)
          if (!cancelled) setLoading(false)
          return
        }
        const store = await getStoreByVendorId(vendor.id)
        if (!store || cancelled) {
          setNeedsRegistration(true)
          if (!cancelled) setLoading(false)
          return
        }
        if (store.status === "suspended") {
          router.push("/vendor")
          return
        }
        setStoreId(store.id)
        setStripeConnected(!!(store as any).stripe_onboarding_complete || !!(store as any).stripe_account_id)
        setFormData({
          name: store.name || "",
          description: store.description || "",
          category: store.category || "",
          address: store.address || "",
          phone: store.phone || "",
          email: store.email || "",
          website: store.website || ""
        })
        if (store.logo_url) {
          setLogoPreview(store.logo_url)
          setInitialLogoUrl(store.logo_url)
        }
      } catch (e) {
        console.error("Load store error:", e)
        setLoadError(e instanceof Error ? e.message : "Failed to load store")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function tryLoadStore() {
      setLoadError(null)
      setNeedsRegistration(false)
      setNotSignedIn(false)
      try {
        // Same auth source as VendorDashboard: getCurrentUser() with retries for session rehydration
        let user = await getCurrentUser()
        const delays = [300, 600]
        for (const ms of delays) {
          if (user || cancelled) break
          await new Promise((r) => setTimeout(r, ms))
          user = await getCurrentUser()
        }
        if (!user || cancelled) {
          setNotSignedIn(true)
          if (!cancelled) setLoading(false)
          return
        }
        await loadStoreWithUser(user)
      } catch (e) {
        console.error("Load store error:", e)
        setLoadError(e instanceof Error ? e.message : "Failed to load store")
        if (!cancelled) setLoading(false)
      }
    }

    tryLoadStore()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session?.user && !storeId) {
        setNotSignedIn(false)
        loadStoreWithUser(session.user)
      }
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [router])

  // Handle return from Stripe Connect onboarding (when started from this page)
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
          router.replace("/vendor/store", { scroll: false })
        }
      } catch (e) {
        console.error("Stripe complete error:", e)
      }
    }
    completeOnboarding()
  }, [searchParams, router, showToast])

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
        body: JSON.stringify({ storeId, returnPath: "/vendor/store" }),
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

  const handleDisconnectStripe = async () => {
    if (!storeId) return
    if (!window.confirm("Disconnect your Stripe account? You can connect again or use a different account later.")) return
    setStripeDisconnecting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        showToast("Please sign in to disconnect Stripe.", "error")
        setStripeDisconnecting(false)
        return
      }
      const res = await fetch("/api/stripe/connect/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ storeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || "Failed to disconnect Stripe.", "error")
        setStripeDisconnecting(false)
        return
      }
      setStripeConnected(false)
      showToast("Stripe account disconnected. You can connect again or a different account.", "success")
    } catch (e) {
      console.error("Disconnect Stripe error:", e)
      showToast("Something went wrong. Please try again.", "error")
    } finally {
      setStripeDisconnecting(false)
    }
  }

  const handleOpenStripeDashboard = async () => {
    if (!storeId) return
    setStripeDashboardOpening(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        showToast("Please sign in to open Stripe dashboard.", "error")
        setStripeDashboardOpening(false)
        return
      }
      const res = await fetch("/api/stripe/connect/dashboard-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ storeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || "Failed to open Stripe dashboard.", "error")
        setStripeDashboardOpening(false)
        return
      }
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer")
        showToast("Opened Stripe dashboard. Check your balance and payouts there.", "info")
      }
    } catch (e) {
      console.error("Open Stripe dashboard error:", e)
      showToast("Something went wrong. Please try again.", "error")
    } finally {
      setStripeDashboardOpening(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image should be less than 5MB", "error")
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId) return

    setSaving(true)
    try {
      const payload: Record<string, string> = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        category: formData.category?.trim() || "",
        address: formData.address?.trim() || "",
        phone: formData.phone?.trim() || "",
        email: formData.email?.trim() || "",
        website: formData.website?.trim() || ""
      }
      if (logoFile && storeId) {
        const logoUrl = await uploadStoreLogo(logoFile, storeId)
        payload.logo_url = logoUrl
      } else if (initialLogoUrl && !logoPreview) {
        payload.logo_url = ""
      }
      await updateStore(storeId, payload)
      showToast("Store details saved successfully.", "success")
      if (logoFile) {
        setLogoFile(null)
        setInitialLogoUrl(payload.logo_url || "")
      }
      if (!logoPreview && payload.logo_url) setLogoPreview(payload.logo_url)
    } catch (err: any) {
      console.error("Save store error:", err)
      showToast(err.message || "Failed to save. Please try again.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (notSignedIn) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/vendor")}
            className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Setup</h1>
            <p className="text-gray-600 mb-8">Configure your store details and information</p>
            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-6">
                  Please sign in to access Store Setup. You need to be logged in as a vendor to edit your store.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Back to home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (needsRegistration || loadError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/vendor")}
            className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Setup</h1>
            <p className="text-gray-600 mb-8">Configure your store details and information</p>
            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-6">
                  {loadError
                    ? loadError
                    : "You need to complete your store registration first. Once your store is set up and approved, you can edit your details and connect Stripe here."}
                </p>
                <Button
                  onClick={() => router.push("/vendor/register-store")}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Go to Store Registration
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/vendor")}
          className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Setup</h1>
          <p className="text-gray-600 mb-8">Configure your store details and information</p>

          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Store Information</CardTitle>
              <CardDescription className="text-gray-600">
                Update your store details to help customers find and learn about your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-gray-900">
                    Store Name *
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white border-gray-200 text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-semibold text-gray-900">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-semibold text-gray-900">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    <option value="">Select a category</option>
                    {STORE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-semibold text-gray-900">
                    Address
                  </label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-white border-gray-200 text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                      Phone
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-gray-900">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm font-semibold text-gray-900">
                    Website
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
                      <span className="text-sm text-gray-600">Logo uploaded</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload an image file (max 5MB). Supported formats: JPG, PNG, GIF
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/vendor")}
                    className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Stripe payout account */}
          {storeId && (
            <Card className="border border-gray-200 bg-gray-50 mt-8">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Stripe payout account
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Connect your Stripe account to receive payouts. After an order is marked delivered, your share (after platform commission) is transferred when the admin processes payouts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stripeConnected ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Stripe account connected</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Open your Stripe Express dashboard to see your balance, payouts, and test transfers.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={handleOpenStripeDashboard}
                        disabled={stripeDashboardOpening}
                        variant="outline"
                        className="border-primary/50 bg-white text-primary hover:bg-primary/5"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {stripeDashboardOpening ? "Opening..." : "Open Stripe dashboard"}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleConnectStripe}
                        disabled={stripeConnecting}
                        variant="outline"
                        className="border-gray-300 bg-white text-gray-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {stripeConnecting ? "Redirecting..." : "Reconnect / Update Stripe"}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDisconnectStripe}
                        disabled={stripeDisconnecting}
                        variant="outline"
                        className="border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                      >
                        {stripeDisconnecting ? "Disconnecting..." : "Disconnect Stripe account"}
                      </Button>
                    </div>
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
        </div>
      </div>
    </div>
  )
}

