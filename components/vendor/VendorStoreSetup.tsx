"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Save,
  ArrowLeft,
  Upload,
  X,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Key,
  Copy,
  Trash2,
} from "lucide-react"
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
  const [pluginIntegration, setPluginIntegration] = useState<{ id: string; store_id: string; name: string; api_key_prefix: string; api_key_plain?: string | null } | null>(null)
  const [pluginKeyLoading, setPluginKeyLoading] = useState(false)
  const [pluginKeyCreating, setPluginKeyCreating] = useState(false)
  const [pluginKeyModal, setPluginKeyModal] = useState<string | null>(null)
  const [pluginKeyDeleting, setPluginKeyDeleting] = useState(false)
  const [pluginIntegrationName, setPluginIntegrationName] = useState("")

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

  // Load plugin integration for this store when storeId is available
  useEffect(() => {
    if (!storeId) {
      setPluginIntegration(null)
      return
    }
    let cancelled = false
    setPluginKeyLoading(true)
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token || cancelled) return
        const res = await fetch("/api/vendor/plugin-integration", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json()
        if (cancelled) return
        const list = Array.isArray(data.integrations) ? data.integrations : []
        const forThisStore = list.find((i: { store_id: string }) => i.store_id === storeId)
        setPluginIntegration(forThisStore ? { id: forThisStore.id, store_id: forThisStore.store_id, name: forThisStore.name || "", api_key_prefix: forThisStore.api_key_prefix || "", api_key_plain: forThisStore.api_key_plain ?? null } : null)
        if (!forThisStore) setPluginIntegrationName("My Store Plugin")
      } catch (e) {
        console.error("Load plugin integration error:", e)
      } finally {
        if (!cancelled) setPluginKeyLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [storeId])

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

  const handleCreatePluginKey = async () => {
    if (!storeId || !pluginIntegrationName.trim()) {
      showToast("Enter a name for your plugin integration.", "error")
      return
    }
    setPluginKeyCreating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        showToast("Please sign in to create an API key.", "error")
        setPluginKeyCreating(false)
        return
      }
      const res = await fetch("/api/vendor/plugin-integration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ store_id: storeId, name: pluginIntegrationName.trim(), fee_per_order: 0 }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || "Failed to create API key.", "error")
        setPluginKeyCreating(false)
        return
      }
      const key = data.api_key ?? data.api_key_plain ?? null
      setPluginIntegration({
        id: data.id,
        store_id: data.store_id,
        name: data.name || pluginIntegrationName.trim(),
        api_key_prefix: data.api_key_prefix || "gfty_live_…",
        api_key_plain: key,
      })
      setPluginKeyModal(key)
      showToast("API key created. You can copy it below anytime.", "success")
    } catch (e) {
      console.error("Create plugin key error:", e)
      showToast("Something went wrong. Please try again.", "error")
    } finally {
      setPluginKeyCreating(false)
    }
  }

  const fullApiKey = pluginIntegration?.api_key_plain ?? pluginKeyModal ?? ""

  const handleCopyPluginKey = () => {
    if (fullApiKey) {
      navigator.clipboard.writeText(fullApiKey).then(() => showToast("API key copied to clipboard.", "success")).catch(() => showToast("Could not copy. Copy the key manually.", "error"))
      return
    }
    if (pluginIntegration?.api_key_prefix) {
      navigator.clipboard.writeText(pluginIntegration.api_key_prefix).then(() => showToast("Prefix copied. Full key is not available.", "info")).catch(() => showToast("Could not copy.", "error"))
    }
  }

  const handleDeletePluginKey = async () => {
    if (!pluginIntegration?.id || !window.confirm("Delete this API key? Any external store or plugin using it will stop working. You can create a new key afterward.")) return
    setPluginKeyDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        showToast("Please sign in to delete the API key.", "error")
        setPluginKeyDeleting(false)
        return
      }
      const res = await fetch(`/api/vendor/plugin-integration?integration_id=${encodeURIComponent(pluginIntegration.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || "Failed to delete API key.", "error")
        setPluginKeyDeleting(false)
        return
      }
      setPluginIntegration(null)
      setPluginKeyModal(null)
      setPluginIntegrationName("My Store Plugin")
      if (typeof window !== "undefined") try { sessionStorage.removeItem(`plugin_api_key_${storeId}`) } catch (_) {}
      showToast("API key deleted. You can create a new one below.", "success")
    } catch (e) {
      console.error("Delete plugin key error:", e)
      showToast("Something went wrong. Please try again.", "error")
    } finally {
      setPluginKeyDeleting(false)
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Preparing your store profile…</p>
        </div>
      </div>
    )
  }

  if (notSignedIn) {
    return (
      <div className="min-h-screen bg-slate-50">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Store profile setup</h1>
            <p className="text-gray-600 mb-8">
              Create your vendor store profile to start receiving orders and payouts.
            </p>
            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
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
                    className="border-gray-200 bg-white text-gray-900 hover:bg-primary/10 hover:text-primary"
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
      <div className="min-h-screen bg-slate-50">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Store profile setup</h1>
            <p className="text-gray-600 mb-8">
              Before customizing your live profile, finish a quick one-time store registration.
            </p>
            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/vendor")}
          className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to dashboard
        </Button>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header + progress style */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Store profile setup</h1>
              <p className="text-gray-600 mt-2">
                Make your store look premium to customers and ensure payouts work smoothly.
              </p>
            </div>
            <div className="rounded-full bg-white shadow-sm border border-gray-100 px-4 py-2 flex flex-wrap items-center gap-2 justify-start lg:justify-end">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  1
                </span>
                <span>Profile</span>
              </div>
              <span className="text-gray-400 text-xs">—</span>
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                  2
                </span>
                <span>Branding</span>
              </div>
              <span className="text-gray-400 text-xs">—</span>
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                  3
                </span>
                <span>Payments & API</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6 items-start">
            {/* Left: main form */}
            <Card className="border border-gray-100 bg-white rounded-xl shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-gray-900">Store details</CardTitle>
                <CardDescription className="text-gray-600">
                  This information appears on customer-facing pages and in emails.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic info */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-semibold text-gray-900">
                        Store name *
                      </label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Giftyzet Flowers & Gifts"
                        className="bg-white border-gray-200 text-gray-900"
                      />
                      <p className="text-xs text-gray-500">
                        Use a clear brand name customers will recognize on emails and receipts.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="description" className="text-sm font-semibold text-gray-900">
                        Short bio / tagline
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        placeholder="Describe what you sell and what makes your store special."
                        className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <p className="text-xs text-gray-500">
                        This appears on your public store profile and in some email templates.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="category" className="text-sm font-semibold text-gray-900">
                        Category
                      </label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Select a category</option>
                        {STORE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">Helps customers understand what type of store you are.</p>
                    </div>
                  </div>

                  {/* Contact & address */}
                  <div className="space-y-4 border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900">Contact & location</h3>
                    <div className="space-y-1.5">
                      <label htmlFor="address" className="text-sm font-medium text-gray-900">
                        Business address
                      </label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street, city, state, ZIP"
                        className="bg-white border-gray-200 text-gray-900"
                      />
                      <p className="text-xs text-gray-500">
                        Used for invoices and some shipping-related emails. Customers do not see your full address by
                        default.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="phone" className="text-sm font-medium text-gray-900">
                          Support phone
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

                      <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-medium text-gray-900">
                          Contact email
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="support@yourstore.com"
                          className="bg-white border-gray-200 text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="website" className="text-sm font-medium text-gray-900">
                        Website (optional)
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
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving…" : "Save profile"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/vendor")}
                      className="border-primary/40 bg-white text-primary hover:bg-primary/5 hover:border-primary/60"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Right: branding preview + integrations */}
            <div className="space-y-4">
              {/* Branding / logo */}
              <Card className="border border-gray-100 bg-white rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-900">Branding</CardTitle>
                  <CardDescription className="text-gray-600">
                    Upload a logo to make your store profile feel like a premium brand.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
                    <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center border border-dashed border-gray-300 overflow-hidden shrink-0">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400 text-center px-2">Logo preview</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-xs text-gray-500">
                        This image appears on order emails and parts of your customer experience. A clear, centered logo
                        works best.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                        >
                          <Upload className="h-3 w-3 mr-2" />
                          {logoPreview ? "Change logo" : "Upload logo"}
                        </Button>
                        {logoPreview && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleRemoveLogo}
                            className="border border-red-200 bg-white text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Recommended: square image, at least 256×256px. Max size 5MB. JPG, PNG, or GIF.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stripe payout account */}
              {storeId && (
                <Card className="border border-gray-100 bg-white rounded-xl shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payouts via Stripe
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Connect Stripe so you can receive your share of each delivered order.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {stripeConnected ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Stripe account connected</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          You can review balances and payouts inside your Stripe Express dashboard. You can also update
                          your bank account details there.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            onClick={handleOpenStripeDashboard}
                            disabled={stripeDashboardOpening}
                            variant="outline"
                            className="border-primary/50 bg-white text-primary hover:bg-primary/5 disabled:opacity-50"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {stripeDashboardOpening ? "Opening…" : "Open Stripe dashboard"}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleConnectStripe}
                            disabled={stripeConnecting}
                            variant="outline"
                            className="border-primary/40 bg-white text-primary hover:bg-primary/5 hover:border-primary/60 disabled:opacity-50"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            {stripeConnecting ? "Redirecting…" : "Reconnect / update Stripe"}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleDisconnectStripe}
                            disabled={stripeDisconnecting}
                            variant="outline"
                            className="border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            {stripeDisconnecting ? "Disconnecting…" : "Disconnect Stripe"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-600">
                          Required to receive payouts. You will be redirected to Stripe to complete onboarding.
                        </p>
                        <Button
                          type="button"
                          onClick={handleConnectStripe}
                          disabled={stripeConnecting}
                          variant="outline"
                          className="border-primary/50 bg-white text-primary hover:bg-primary/5 disabled:opacity-50"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {stripeConnecting ? "Redirecting…" : "Connect Stripe account"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Plugin API key – create once per store */}
              {storeId && (
                <Card className="border border-gray-100 bg-white rounded-xl shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Plugin API key
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Connect an external website or plugin to automatically create gift orders via the Giftyzel Plugin
                      API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {pluginKeyLoading ? (
                      <p className="text-sm text-gray-500">Loading…</p>
                    ) : pluginIntegration ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">API key created</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Input
                            readOnly
                            value={fullApiKey || pluginIntegration.api_key_prefix}
                            className="font-mono text-xs bg-gray-100 border-gray-300 flex-1"
                            placeholder="API key"
                          />
                          <Button
                            type="button"
                            onClick={handleCopyPluginKey}
                            variant="outline"
                            className="shrink-0 gap-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                          >
                            <Copy className="h-4 w-4" />
                            {fullApiKey ? "Copy" : "Copy prefix"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600">
                          Use this value in the <code className="font-mono">X-API-Key</code> header when calling the
                          Plugin API. Treat it like a password.
                        </p>
                        <Button
                          type="button"
                          onClick={handleDeletePluginKey}
                          disabled={pluginKeyDeleting}
                          variant="outline"
                          className="w-fit border-red-200 bg-white text-red-700 hover:bg-red-50 gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {pluginKeyDeleting ? "Deleting…" : "Delete API key"}
                        </Button>
                        <p className="text-[11px] text-gray-500 leading-snug">
                          Deleting will immediately stop any external integrations using this key. You can create a new
                          key afterwards if needed.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">
                            Integration name
                          </label>
                          <Input
                            type="text"
                            value={pluginIntegrationName}
                            onChange={(e) => setPluginIntegrationName(e.target.value)}
                            placeholder="e.g. Shopify store, WooCommerce plugin"
                            className="max-w-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleCreatePluginKey}
                          disabled={pluginKeyCreating}
                          variant="outline"
                          className="border-primary/50 bg-white text-primary hover:bg-primary/5 w-fit disabled:opacity-50"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          {pluginKeyCreating ? "Creating…" : "Create API key"}
                        </Button>
                        <p className="text-[11px] text-gray-500 leading-snug">
                          You can create one key per store. Copy and store it securely when it is first shown—Giftyzel
                          may only display the full value once.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

