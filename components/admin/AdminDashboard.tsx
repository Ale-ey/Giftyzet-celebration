"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Store,
  CheckCircle2,
  Clock,
  Ban,
  Percent,
  Video,
  Gift,
  Store as StoreIcon,
  MessageSquare,
  Mail,
  Eye,
  Plug,
  Wallet,
  DollarSign,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { getCurrentUserWithProfile, getCurrentUser } from "@/lib/api/auth"
import { supabase } from "@/lib/supabase/client"
import {
  getPendingStores as getApiPendingStores,
  getAllApprovedStores,
  getSuspendedStores as getApiSuspendedStores,
  approveStore as apiApproveStore,
  suspendStore as apiSuspendStore,
  rejectStore as apiRejectStore,
} from "@/lib/api/vendors"
import type { Order } from "@/types"

type TabId = "stores" | "commission" | "queries" | "pluginQueries" | "payouts" | "pluginOrders"
type StoreStatusFilter = "all" | "pending" | "approved" | "suspended"

interface ContactSubmission {
  id: string
  name: string
  email: string
  query: string
  created_at: string
}

interface PluginSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  query: string
  created_at: string
}

interface PayoutRow {
  id: string
  vendor_order_id: string
  order_id: string
  order_number: string
  store_name: string
  vendor_name: string
  order_total: number
  commission_amount: number
  vendor_amount: number
  delivered_at: string
  status: "pending" | "paid" | "failed"
  paid_at?: string
}

interface PluginOrderRow {
  id: string
  order_number: string
  external_order_id: string | null
  store_name: string
  vendor_name: string
  integration_name: string
  status: string
  payment_status: string
  total: number
  commission_percent: number
  commission_amount: number
  plugin_fee: number
  vendor_amount: number
  created_at: string
  confirmed_at: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("stores")
  const [storeStatusFilter, setStoreStatusFilter] = useState<StoreStatusFilter>("all")

  const [pendingStores, setPendingStores] = useState<any[]>([])
  const [approvedStores, setApprovedStores] = useState<any[]>([])
  const [suspendedStores, setSuspendedStores] = useState<any[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [commissionPercent, setCommissionPercent] = useState<string>("10")
  const [taxPercent, setTaxPercent] = useState<string>("8")
  const [pluginTax, setPluginTax] = useState<string>("0")
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [commissionSaving, setCommissionSaving] = useState(false)

  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([])
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)

  const [pluginSubmissions, setPluginSubmissions] = useState<PluginSubmission[]>([])
  const [pluginQueriesLoading, setPluginQueriesLoading] = useState(false)
  const [pluginQueriesError, setPluginQueriesError] = useState<string | null>(null)

  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [payoutsTotal, setPayoutsTotal] = useState(0)
  const [payoutsLoading, setPayoutsLoading] = useState(false)
  const [payoutsError, setPayoutsError] = useState<string | null>(null)
  const [selectedPayoutIds, setSelectedPayoutIds] = useState<Set<string>>(new Set())
  const [processPayoutsLoading, setProcessPayoutsLoading] = useState(false)
  const [showProcessPayoutsConfirm, setShowProcessPayoutsConfirm] = useState(false)
  const searchParams = useSearchParams()
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null)

  const [giftingVideoUrl, setGiftingVideoUrl] = useState("")
  const [vendorVideoUrl, setVendorVideoUrl] = useState("")
  const [overviewVideosLoading, setOverviewVideosLoading] = useState(false)
  const [overviewVideosSaving, setOverviewVideosSaving] = useState(false)
  const [showConfirmSettingsModal, setShowConfirmSettingsModal] = useState(false)
  const { showToast } = useToast()

  const [pluginOrders, setPluginOrders] = useState<PluginOrderRow[]>([])
  const [pluginOrdersTotal, setPluginOrdersTotal] = useState(0)
  const [pluginOrdersLoading, setPluginOrdersLoading] = useState(false)
  const [pluginOrdersError, setPluginOrdersError] = useState<string | null>(null)
  const [pluginOrdersPage, setPluginOrdersPage] = useState(1)
  const [pluginOrdersStatus, setPluginOrdersStatus] = useState<string>("all")

  useEffect(() => {
    if (typeof window === "undefined") return
    const checkAuth = async () => {
      try {
        const userProfile = await getCurrentUserWithProfile()
        if (userProfile?.role === "admin") {
          setIsAuthorized(true)
        } else {
          router.push("/")
          return
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/")
        return
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (typeof window === "undefined" || !isAuthorized) return
    loadStoresData()
  }, [isAuthorized])

  useEffect(() => {
    if (!isAuthorized) return
    const loadSettings = async () => {
      setCommissionLoading(true)
      try {
        const res = await fetch("/api/admin/commission")
        const data = await res.json()
        if (res.ok) {
          if (data.commission_percent != null) setCommissionPercent(String(data.commission_percent))
          if (data.tax_percent != null) setTaxPercent(String(data.tax_percent))
          if (data.plugin_tax != null) setPluginTax(String(data.plugin_tax))
        }
      } catch (e) {
        console.error("Load settings error:", e)
      } finally {
        setCommissionLoading(false)
      }
    }
    loadSettings()
  }, [isAuthorized])

  useEffect(() => {
    if (!isAuthorized) return
    const loadOverviewVideos = async () => {
      setOverviewVideosLoading(true)
      try {
        const res = await fetch("/api/admin/overview-videos")
        const data = await res.json()
        if (res.ok) {
          setGiftingVideoUrl(data.giftingVideoUrl ?? "")
          setVendorVideoUrl(data.vendorVideoUrl ?? "")
        }
      } catch (e) {
        console.error("Load overview videos error:", e)
      } finally {
        setOverviewVideosLoading(false)
      }
    }
    loadOverviewVideos()
  }, [isAuthorized])

  useEffect(() => {
    if (!isAuthorized || activeTab !== "queries") return
    const fetchQueries = async () => {
      setContactLoading(true)
      setContactError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch("/api/admin/contact-queries", {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        })
        const data = await res.json()
        if (!res.ok) {
          setContactError(data.error || "Failed to load contact queries")
          setContactSubmissions([])
          return
        }
        setContactSubmissions(data.submissions ?? [])
      } catch (e) {
        setContactError("Failed to load contact queries")
        setContactSubmissions([])
      } finally {
        setContactLoading(false)
      }
    }
    fetchQueries()
  }, [isAuthorized, activeTab])

  const payoutsPage = Math.max(1, parseInt(searchParams.get("payout_page") || "1", 10))
  const payoutsSearch = searchParams.get("payout_search") || ""
  const payoutsStoreName = searchParams.get("payout_store") || ""
  const payoutsVendorName = searchParams.get("payout_vendor") || ""
  const payoutsStatus = (searchParams.get("payout_status") || "all") as "all" | "pending" | "paid" | "failed"

  const setPayoutsParams = useCallback(
    (updates: { page?: number; search?: string; store_name?: string; vendor_name?: string; status?: string }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (updates.page !== undefined) params.set("payout_page", String(updates.page))
      if (updates.search !== undefined) {
        if (updates.search) params.set("payout_search", updates.search)
        else params.delete("payout_search")
        params.set("payout_page", "1")
      }
      if (updates.store_name !== undefined) {
        if (updates.store_name) params.set("payout_store", updates.store_name)
        else params.delete("payout_store")
        params.set("payout_page", "1")
      }
      if (updates.vendor_name !== undefined) {
        if (updates.vendor_name) params.set("payout_vendor", updates.vendor_name)
        else params.delete("payout_vendor")
        params.set("payout_page", "1")
      }
      if (updates.status !== undefined) {
        if (updates.status && updates.status !== "all") params.set("payout_status", updates.status)
        else params.delete("payout_status")
        params.set("payout_page", "1")
      }
      router.push(`/admin?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  useEffect(() => {
    if (!isAuthorized || activeTab !== "payouts") return
    const fetchPayouts = async () => {
      setPayoutsLoading(true)
      setPayoutsError(null)
      setPayoutMessage(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const q = new URLSearchParams()
        q.set("page", String(payoutsPage))
        q.set("per_page", "10")
        if (payoutsSearch) q.set("search", payoutsSearch)
        if (payoutsStoreName) q.set("store_name", payoutsStoreName)
        if (payoutsVendorName) q.set("vendor_name", payoutsVendorName)
        if (payoutsStatus !== "all") q.set("status", payoutsStatus)
        const res = await fetch(`/api/admin/payouts?${q.toString()}`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        })
        const data = await res.json()
        if (!res.ok) {
          setPayoutsError(data.error || "Failed to load payouts")
          setPayouts([])
          setPayoutsTotal(0)
          return
        }
        setPayouts(data.payouts ?? [])
        setPayoutsTotal(data.total ?? 0)
        setSelectedPayoutIds(new Set())
      } catch (e) {
        setPayoutsError("Failed to load payouts")
        setPayouts([])
        setPayoutsTotal(0)
      } finally {
        setPayoutsLoading(false)
      }
    }
    fetchPayouts()
  }, [isAuthorized, activeTab, payoutsPage, payoutsSearch, payoutsStoreName, payoutsVendorName, payoutsStatus])

  useEffect(() => {
    if (!isAuthorized || activeTab !== "pluginQueries") return
    const fetchPluginQueries = async () => {
      setPluginQueriesLoading(true)
      setPluginQueriesError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch("/api/admin/plugin-queries", {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        })
        const data = await res.json()
        if (!res.ok) {
          setPluginQueriesError(data.error || "Failed to load plugin queries")
          setPluginSubmissions([])
          return
        }
        setPluginSubmissions(data.submissions ?? [])
      } catch (e) {
        setPluginQueriesError("Failed to load plugin queries")
        setPluginSubmissions([])
      } finally {
        setPluginQueriesLoading(false)
      }
    }
    fetchPluginQueries()
  }, [isAuthorized, activeTab])

  useEffect(() => {
    if (!isAuthorized || activeTab !== "pluginOrders") return
    const fetchPluginOrders = async () => {
      setPluginOrdersLoading(true)
      setPluginOrdersError(null)
      try {
        const headers = await getAuthHeaders()
        const q = new URLSearchParams()
        q.set("page", String(pluginOrdersPage))
        q.set("per_page", "20")
        if (pluginOrdersStatus !== "all") q.set("status", pluginOrdersStatus)
        const res = await fetch(`/api/admin/plugin-orders?${q.toString()}`, { headers })
        const data = await res.json()
        if (!res.ok) {
          setPluginOrdersError(data.error || "Failed to load plugin orders")
          setPluginOrders([])
          return
        }
        setPluginOrders(data.orders ?? [])
        setPluginOrdersTotal(data.total ?? 0)
      } catch (e) {
        setPluginOrdersError("Failed to load plugin orders")
        setPluginOrders([])
      } finally {
        setPluginOrdersLoading(false)
      }
    }
    fetchPluginOrders()
  }, [isAuthorized, activeTab, pluginOrdersPage, pluginOrdersStatus])

  const loadStoresData = async () => {
    try {
      setLoading(true)
      const [pending, approved, suspended] = await Promise.all([
        getApiPendingStores(),
        getAllApprovedStores(),
        getApiSuspendedStores(),
      ])
      setPendingStores(pending || [])
      setApprovedStores(approved || [])
      setSuspendedStores(suspended || [])
      setOrders([])
    } catch (error) {
      console.error("Error loading stores:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveStore = async (storeId: string) => {
    try {
      setActionLoading(storeId)
      const user = await getCurrentUser()
      if (!user) return
      await apiApproveStore(storeId, user.id)
      await loadStoresData()
    } catch (error) {
      console.error("Error approving store:", error)
      alert("Failed to approve store. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectStore = async (storeId: string) => {
    try {
      setActionLoading(storeId)
      await apiRejectStore(storeId)
      await loadStoresData()
    } catch (error) {
      console.error("Error rejecting store:", error)
      alert("Failed to reject store. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspendStore = async (storeId: string) => {
    try {
      setActionLoading(storeId)
      await apiSuspendStore(storeId)
      await loadStoresData()
    } catch (error) {
      console.error("Error suspending store:", error)
      alert("Failed to suspend store. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivateStore = async (storeId: string) => {
    try {
      setActionLoading(storeId)
      const user = await getCurrentUser()
      if (!user) return
      await apiApproveStore(storeId, user.id)
      await loadStoresData()
    } catch (error) {
      console.error("Error reactivating store:", error)
      alert("Failed to reactivate store. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    }
  }

  const handleOpenSaveSettingsConfirm = () => {
    const commission = parseFloat(commissionPercent)
    const tax = parseFloat(taxPercent)
    const plugin = parseFloat(pluginTax)
    if (isNaN(commission) || commission < 0 || commission > 100) {
      showToast("Commission must be between 0 and 100", "error")
      return
    }
    if (isNaN(tax) || tax < 0 || tax > 100) {
      showToast("Platform service must be between 0 and 100", "error")
      return
    }
    setShowConfirmSettingsModal(true)
  }

  const handleSaveCommission = async () => {
    setShowConfirmSettingsModal(false)
    const commission = parseFloat(commissionPercent)
    const tax = parseFloat(taxPercent)
    const plugin = parseFloat(pluginTax)
    setCommissionSaving(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch("/api/admin/commission", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          commission_percent: commission,
          tax_percent: tax,
          plugin_tax: isNaN(plugin) ? 0 : plugin,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || "Failed to save settings", "error")
        return
      }
      showToast("Platform service & Plugin service updated successfully. Values will appear on the landing page and at checkout.", "success")
    } catch (e) {
      console.error("Save settings error:", e)
      showToast("Failed to save settings. Please try again.", "error")
    } finally {
      setCommissionSaving(false)
    }
  }

  const handleSaveOverviewVideos = async () => {
    setOverviewVideosSaving(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch("/api/admin/overview-videos", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          giftingVideoUrl: giftingVideoUrl.trim() || null,
          vendorVideoUrl: vendorVideoUrl.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to save overview videos")
        return
      }
      alert("Overview videos saved.")
    } catch (e) {
      console.error("Save overview videos error:", e)
      alert("Failed to save overview videos.")
    } finally {
      setOverviewVideosSaving(false)
    }
  }

  const formatContactDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const totalStores = approvedStores.length + suspendedStores.length
  const pendingCount = pendingStores.length
  const suspendedCount = suspendedStores.length
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === "pending").length

  const allStores = [
    ...pendingStores.map((s) => ({ ...s, status: "pending" as const })),
    ...approvedStores.map((s) => ({ ...s, status: "approved" as const })),
    ...suspendedStores.map((s) => ({ ...s, status: "suspended" as const })),
  ]
  const filteredStores =
    storeStatusFilter === "all"
      ? allStores
      : allStores.filter((s) => s.status === storeStatusFilter)

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "stores", label: "Stores", icon: <Store className="h-4 w-4" /> },
    { id: "commission", label: "Tax & Plugin", icon: <Percent className="h-4 w-4" /> },
    { id: "payouts", label: "Payouts", icon: <Wallet className="h-4 w-4" /> },
    { id: "pluginOrders", label: "Plugin Orders", icon: <Plug className="h-4 w-4" /> },
    { id: "queries", label: "Contact Queries", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "pluginQueries", label: "Plugin Queries", icon: <Plug className="h-4 w-4" /> },
  ]

  const togglePayoutSelection = (id: string) => {
    setSelectedPayoutIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const payablesPayouts = payouts.filter((p) => p.status === "pending" || p.status === "failed")

  const selectAllPayouts = () => {
    if (selectedPayoutIds.size === payablesPayouts.length) setSelectedPayoutIds(new Set())
    else setSelectedPayoutIds(new Set(payablesPayouts.map((p) => p.id)))
  }

  const handleProcessPayouts = async () => {
    setShowProcessPayoutsConfirm(false)
    const ids = Array.from(selectedPayoutIds)
    if (!ids.length) {
      setPayoutMessage("Select at least one payout to pay.")
      return
    }
    setProcessPayoutsLoading(true)
    setPayoutMessage(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch("/api/admin/process-payouts", {
        method: "POST",
        headers,
        body: JSON.stringify({ vendor_order_ids: ids }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPayoutMessage(data.error || "Failed to process payouts")
        return
      }
      setPayoutMessage(
        data.processed > 0
          ? `Processed ${data.processed} payout(s).${data.errors?.length ? " Some errors: " + data.errors.join("; ") : ""}`
          : data.message || "No payouts processed."
      )
      setSelectedPayoutIds(new Set())
      if (data.processed > 0) {
        const q = new URLSearchParams()
        q.set("page", String(payoutsPage))
        q.set("per_page", "10")
        if (payoutsSearch) q.set("search", payoutsSearch)
        if (payoutsStoreName) q.set("store_name", payoutsStoreName)
        if (payoutsVendorName) q.set("vendor_name", payoutsVendorName)
        if (payoutsStatus !== "all") q.set("status", payoutsStatus)
        const res2 = await fetch(`/api/admin/payouts?${q.toString()}`, { headers })
        const data2 = await res2.json()
        if (res2.ok) {
          setPayouts(data2.payouts ?? [])
          setPayoutsTotal(data2.total ?? 0)
        }
      }
    } catch (e) {
      console.error("Process payouts error:", e)
      setPayoutMessage("Failed to process payouts.")
    } finally {
      setProcessPayoutsLoading(false)
    }
  }

  const formatPayoutDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage vendors, stores, and platform settings</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Stores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalStores}</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Suspended Stores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{suspendedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab: Stores */}
        {activeTab === "stores" && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Stores</CardTitle>
              <CardDescription className="text-gray-600">
                View store details and change status (approve, reject, suspend, reactivate).
              </CardDescription>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-sm text-gray-600">Filter by status:</span>
                <select
                  value={storeStatusFilter}
                  onChange={(e) => setStoreStatusFilter(e.target.value as StoreStatusFilter)}
                  className="border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-white text-gray-900"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-gray-500">Loading stores...</div>
              ) : filteredStores.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No stores match the filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Store</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Vendor / Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Category</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStores.map((store) => (
                        <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{store.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {store.vendors?.business_name || store.vendors?.vendor_name || "—"}
                            {(store.email || store.vendors?.email) && (
                              <span className="block text-xs text-gray-500">
                                {store.email || store.vendors?.email}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{store.category || "—"}</td>
                          <td className="py-3 px-4">
                            {store.status === "pending" && (
                              <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <Clock className="h-3 w-3 mr-1 inline" />
                                Pending
                              </Badge>
                            )}
                            {store.status === "approved" && (
                              <Badge className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                                Approved
                              </Badge>
                            )}
                            {store.status === "suspended" && (
                              <Badge className="bg-red-50 text-red-700 border-red-200">
                                <Ban className="h-3 w-3 mr-1 inline" />
                                Suspended
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/store/${store.id}`)}
                                className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="h-3.5 w-3 mr-1" />
                                View
                              </Button>
                              {store.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveStore(store.id)}
                                    disabled={actionLoading === store.id}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {actionLoading === store.id ? "..." : "Approve"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectStore(store.id)}
                                    disabled={actionLoading === store.id}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    {actionLoading === store.id ? "..." : "Reject"}
                                  </Button>
                                </>
                              )}
                              {store.status === "approved" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSuspendStore(store.id)}
                                  disabled={actionLoading === store.id}
                                  className="bg-white border-orange-200 text-orange-600 hover:bg-orange-50/70 hover:border-orange-300"
                                >
                                  <Ban className="h-3.5 w-3 mr-1" />
                                  {actionLoading === store.id ? "..." : "Suspend"}
                                </Button>
                              )}
                              {store.status === "suspended" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleReactivateStore(store.id)}
                                  disabled={actionLoading === store.id}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle2 className="h-3.5 w-3 mr-1" />
                                  {actionLoading === store.id ? "..." : "Reactivate"}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Commission (Platform service & Plugin service) */}
        {activeTab === "commission" && (
          <div className="space-y-6">
            <Card className="border border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Platform service & Plugin service
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Platform service % is applied at checkout. Plugin service % is shown on the landing page (Add Gifting to Your Store). Both are displayed in Sell on GiftyZel / Add Gifting to Your Store cards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="tax" className="text-sm font-medium text-gray-700">
                      Platform service
                    </label>
                    <Input
                      id="tax"
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      disabled={commissionLoading}
                      className="w-24"
                      title="Platform service % applied at checkout and shown on landing"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="plugin_tax" className="text-sm font-medium text-gray-700">
                      Plugin service
                    </label>
                    <Input
                      id="plugin_tax"
                      type="number"
                      min={0}
                      step={0.01}
                      value={pluginTax}
                      onChange={(e) => setPluginTax(e.target.value)}
                      disabled={commissionLoading}
                      className="w-24"
                      title="Plugin service % shown on landing (Add Gifting to Your Store)"
                    />
                  </div>
                  <Button
                    onClick={handleOpenSaveSettingsConfirm}
                    disabled={commissionSaving || commissionLoading}
                    variant="outline"
                    className="border-gray-300 bg-white text-gray-700"
                  >
                    {commissionSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Overview Tab Videos
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Video links for the Overview page: How to Send Gifts and How to Register as Vendor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="gifting-video" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    How to Send Gifts – video link
                  </label>
                  <Input
                    id="gifting-video"
                    type="url"
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    value={giftingVideoUrl}
                    onChange={(e) => setGiftingVideoUrl(e.target.value)}
                    disabled={overviewVideosLoading}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="vendor-video" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <StoreIcon className="h-4 w-4" />
                    How to Register as Vendor – video link
                  </label>
                  <Input
                    id="vendor-video"
                    type="url"
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    value={vendorVideoUrl}
                    onChange={(e) => setVendorVideoUrl(e.target.value)}
                    disabled={overviewVideosLoading}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleSaveOverviewVideos}
                  disabled={overviewVideosSaving || overviewVideosLoading}
                  variant="outline"
                  className="border-gray-300 bg-white text-gray-700"
                >
                  {overviewVideosSaving ? "Saving..." : "Save Overview Videos"}
                </Button>
              </CardContent>
            </Card>
            {/* Confirm save Platform / Plugin service */}
            <Dialog open={showConfirmSettingsModal} onOpenChange={setShowConfirmSettingsModal}>
              <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">Confirm update</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Update Platform service to <strong>{taxPercent}%</strong> and Plugin service to <strong>{pluginTax}%</strong>? These values will appear on the landing page (Sell on GiftyZel and Add Gifting to Your Store) and Platform service is applied at checkout.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmSettingsModal(false)}
                    className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveCommission}
                    disabled={commissionSaving}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {commissionSaving ? "Saving..." : "Confirm & save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Tab: Contact Queries */}
        {activeTab === "queries" && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Contact Queries
              </CardTitle>
              <CardDescription className="text-gray-600">
                Form submissions from the contact section on the site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactLoading ? (
                <div className="py-12 text-center text-gray-500">Loading...</div>
              ) : contactError ? (
                <div className="py-12 text-center text-red-600">{contactError}</div>
              ) : contactSubmissions.length === 0 ? (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                  <Mail className="h-12 w-12 text-gray-300" />
                  <p>No contact submissions yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Message</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 whitespace-nowrap">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactSubmissions.map((row) => (
                        <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">{row.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            <a href={`mailto:${row.email}`} className="text-primary hover:underline">
                              {row.email}
                            </a>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-md">
                            <span className="line-clamp-3 block" title={row.query}>
                              {row.query}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
                            {formatContactDate(row.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Plugin Queries */}
        {activeTab === "pluginQueries" && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Plugin Queries
              </CardTitle>
              <CardDescription className="text-gray-600">
                Submissions from the &quot;Add Gifting to Your Store&quot; section (Get the Plugin button).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pluginQueriesLoading ? (
                <div className="py-12 text-center text-gray-500">Loading...</div>
              ) : pluginQueriesError ? (
                <div className="py-12 text-center text-red-600">{pluginQueriesError}</div>
              ) : pluginSubmissions.length === 0 ? (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                  <Plug className="h-12 w-12 text-gray-300" />
                  <p>No plugin queries yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Phone</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Query</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 whitespace-nowrap">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pluginSubmissions.map((row) => (
                        <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">{row.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            <a href={`mailto:${row.email}`} className="text-primary hover:underline">
                              {row.email}
                            </a>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{row.phone || "—"}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-md">
                            <span className="line-clamp-3 block" title={row.query}>
                              {row.query}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
                            {formatContactDate(row.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Plugin Orders */}
        {activeTab === "pluginOrders" && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Plugin Orders
              </CardTitle>
              <CardDescription className="text-gray-600">
                Orders created via the Plugin API from external selling platforms. Commission and plugin fee are charged from the seller.
              </CardDescription>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <select
                  value={pluginOrdersStatus}
                  onChange={(e) => {
                    setPluginOrdersStatus(e.target.value)
                    setPluginOrdersPage(1)
                  }}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm text-gray-700 bg-white"
                >
                  <option value="all">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {pluginOrdersLoading ? (
                <div className="py-12 text-center text-gray-500">Loading plugin orders...</div>
              ) : pluginOrdersError ? (
                <div className="py-12 text-center text-red-600">{pluginOrdersError}</div>
              ) : pluginOrders.length === 0 ? (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                  <Plug className="h-12 w-12 text-gray-300" />
                  <p>No plugin orders match your filters.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Order #</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">External ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Integration</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Store</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Vendor</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Total</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Commission</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Plugin fee</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Vendor amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pluginOrders.map((row) => (
                          <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.order_number}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{row.external_order_id || "—"}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{row.integration_name}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{row.store_name}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{row.vendor_name}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className={
                                  row.status === "delivered"
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : row.status === "confirmed" || row.status === "dispatched"
                                      ? "border-blue-200 bg-blue-50 text-blue-700"
                                      : row.status === "cancelled"
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : "border-amber-200 bg-amber-50 text-amber-700"
                                }
                              >
                                {row.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                              ${row.total.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">
                              ${row.commission_amount.toFixed(2)}
                              <span className="text-xs text-gray-400 ml-1">({row.commission_percent}%)</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">
                              ${row.plugin_fee.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-primary text-right">
                              ${row.vendor_amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatPayoutDate(row.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {pluginOrdersTotal > 20 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Showing {(pluginOrdersPage - 1) * 20 + 1}–{Math.min(pluginOrdersPage * 20, pluginOrdersTotal)} of {pluginOrdersTotal}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pluginOrdersPage <= 1}
                          onClick={() => setPluginOrdersPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pluginOrdersPage >= Math.ceil(pluginOrdersTotal / 20)}
                          onClick={() => setPluginOrdersPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Payouts */}
        {activeTab === "payouts" && (
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payouts
              </CardTitle>
              <CardDescription className="text-gray-600">
                Delivered orders. Select pending rows and confirm to transfer (after commission) to vendor Stripe accounts.
              </CardDescription>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Input
                  placeholder="Search by store or vendor name"
                  value={payoutsSearch}
                  onChange={(e) => setPayoutsParams({ search: e.target.value })}
                  className="max-w-xs h-9"
                />
                <Input
                  placeholder="Filter by store name"
                  value={payoutsStoreName}
                  onChange={(e) => setPayoutsParams({ store_name: e.target.value })}
                  className="max-w-[180px] h-9"
                />
                <Input
                  placeholder="Filter by vendor name"
                  value={payoutsVendorName}
                  onChange={(e) => setPayoutsParams({ vendor_name: e.target.value })}
                  className="max-w-[180px] h-9"
                />
                <select
                  value={payoutsStatus}
                  onChange={(e) => setPayoutsParams({ status: e.target.value })}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm text-gray-700 bg-white"
                >
                  <option value="all">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
                <Button
                  onClick={() => setShowProcessPayoutsConfirm(true)}
                  disabled={processPayoutsLoading || payablesPayouts.length === 0 || selectedPayoutIds.size === 0}
                  className="bg-primary hover:bg-primary/90 text-white gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  {processPayoutsLoading ? "Processing..." : "Pay selected"}
                </Button>
                {payoutMessage && (
                  <span className="text-sm text-gray-600">{payoutMessage}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {payoutsLoading ? (
                <div className="py-12 text-center text-gray-500">Loading payouts...</div>
              ) : payoutsError ? (
                <div className="py-12 text-center text-red-600">{payoutsError}</div>
              ) : payouts.length === 0 ? (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                  <Wallet className="h-12 w-12 text-gray-300" />
                  <p>No payouts match your filters.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full border-collapse min-w-[800px]">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 w-10">
                            <input
                              type="checkbox"
                              checked={payablesPayouts.length > 0 && selectedPayoutIds.size === payablesPayouts.length}
                              onChange={selectAllPayouts}
                              className="rounded border-gray-300"
                              aria-label="Select all pending and failed"
                            />
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Order #</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Store</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Vendor</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Order total</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Commission</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Vendor amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Delivered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((row) => (
                          <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-3 px-4">
                              {row.status === "pending" || row.status === "failed" ? (
                                <input
                                  type="checkbox"
                                  checked={selectedPayoutIds.has(row.id)}
                                  onChange={() => togglePayoutSelection(row.id)}
                                  className="rounded border-gray-300"
                                  aria-label={`Select payout ${row.order_number}`}
                                />
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.order_number}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{row.store_name}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{row.vendor_name}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className={
                                  row.status === "paid"
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : row.status === "failed"
                                      ? "border-red-200 bg-red-50 text-red-700"
                                      : "border-amber-200 bg-amber-50 text-amber-700"
                                }
                              >
                                {row.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                              ${row.order_total.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              ${row.commission_amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-primary">
                              ${row.vendor_amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatPayoutDate(row.delivered_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {payoutsTotal > 10 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Showing {(payoutsPage - 1) * 10 + 1}–{Math.min(payoutsPage * 10, payoutsTotal)} of {payoutsTotal}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={payoutsPage <= 1}
                          onClick={() => setPayoutsParams({ page: payoutsPage - 1 })}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={payoutsPage >= Math.ceil(payoutsTotal / 10)}
                          onClick={() => setPayoutsParams({ page: payoutsPage + 1 })}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Confirm process payouts modal */}
        <Dialog open={showProcessPayoutsConfirm} onOpenChange={setShowProcessPayoutsConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm payout</DialogTitle>
              <DialogDescription>
                You are about to process {selectedPayoutIds.size} payout(s). This will transfer funds (after commission) to the vendors&apos; Stripe accounts. Continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowProcessPayoutsConfirm(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleProcessPayouts} className="bg-primary hover:bg-primary/90 text-white">
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
