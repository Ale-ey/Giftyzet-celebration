"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Store, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  Ban,
  Percent,
  Wallet,
  Video,
  Gift,
  Store as StoreIcon,
  MessageSquare
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getCurrentUserWithProfile, getCurrentUser } from "@/lib/api/auth"
import { supabase } from "@/lib/supabase/client"
import { 
  getPendingStores as getApiPendingStores,
  getAllApprovedStores,
  getSuspendedStores as getApiSuspendedStores,
  approveStore as apiApproveStore,
  suspendStore as apiSuspendStore,
  rejectStore as apiRejectStore
} from "@/lib/api/vendors"
import type { Order } from "@/types"

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [pendingStores, setPendingStores] = useState<any[]>([])
  const [approvedStores, setApprovedStores] = useState<any[]>([])
  const [suspendedStores, setSuspendedStores] = useState<any[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [commissionPercent, setCommissionPercent] = useState<string>("10")
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [commissionSaving, setCommissionSaving] = useState(false)
  const [processPayoutsLoading, setProcessPayoutsLoading] = useState(false)
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null)
  const [giftingVideoUrl, setGiftingVideoUrl] = useState("")
  const [vendorVideoUrl, setVendorVideoUrl] = useState("")
  const [overviewVideosLoading, setOverviewVideosLoading] = useState(false)
  const [overviewVideosSaving, setOverviewVideosSaving] = useState(false)
  const itemsPerPage = 6

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if user is admin
    const checkAuth = async () => {
      try {
        const userProfile = await getCurrentUserWithProfile()
        if (userProfile?.role === "admin") {
          setIsAuthorized(true)
        } else {
          // Not an admin, redirect to home
          router.push("/")
          return
        }
      } catch (error) {
        console.error("Auth check error:", error)
        // Not logged in or error, redirect to home
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
    const loadCommission = async () => {
      setCommissionLoading(true)
      try {
        const res = await fetch("/api/admin/commission")
        const data = await res.json()
        if (res.ok && data.commission_percent != null) {
          setCommissionPercent(String(data.commission_percent))
        }
      } catch (e) {
        console.error("Load commission error:", e)
      } finally {
        setCommissionLoading(false)
      }
    }
    loadCommission()
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

  const loadStoresData = async () => {
    try {
      setLoading(true)
      // Load data from Supabase
      const [pending, approved, suspended] = await Promise.all([
        getApiPendingStores(),
        getAllApprovedStores(),
        getApiSuspendedStores()
      ])

      setPendingStores(pending || [])
      setApprovedStores(approved || [])
      setSuspendedStores(suspended || [])
      setOrders([]) // TODO: Load orders from Supabase
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
      await loadStoresData() // Reload data
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
      await loadStoresData() // Reload data
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
      await loadStoresData() // Reload data
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
      await loadStoresData() // Reload data
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

  const handleSaveCommission = async () => {
    const value = parseFloat(commissionPercent)
    if (isNaN(value) || value < 0 || value > 100) {
      alert("Commission must be between 0 and 100")
      return
    }
    setCommissionSaving(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch("/api/admin/commission", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ commission_percent: value }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to save commission")
        return
      }
      alert("Commission updated successfully.")
    } catch (e) {
      console.error("Save commission error:", e)
      alert("Failed to save commission.")
    } finally {
      setCommissionSaving(false)
    }
  }

  const handleProcessPayouts = async () => {
    setProcessPayoutsLoading(true)
    setPayoutMessage(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch("/api/admin/process-payouts", { method: "POST", headers })
      const data = await res.json()
      if (!res.ok) {
        setPayoutMessage(data.error || "Failed to process payouts")
        return
      }
      setPayoutMessage(
        data.processed > 0
          ? `Processed ${data.processed} payout(s).${data.errors?.length ? " Some errors: " + data.errors.join("; ") : ""}`
          : data.message || "No payouts due."
      )
    } catch (e) {
      console.error("Process payouts error:", e)
      setPayoutMessage("Failed to process payouts.")
    } finally {
      setProcessPayoutsLoading(false)
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

  if (!isAuthorized || loading) {
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

  // Pagination logic
  const totalPages = Math.ceil(approvedStores.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStores = approvedStores.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage vendors, stores, and monitor platform activity</p>
          </div>
          <Link href="/admin/contact-queries">
            <Button variant="outline" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 gap-2">
              <MessageSquare className="h-4 w-4" />
              Contact Queries
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{pendingOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Commission & Payouts */}
        <Card className="mb-8 border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Commission & Payouts
            </CardTitle>
            <CardDescription className="text-gray-600">
              Set platform commission (%). Vendors receive payouts 7 days after order is marked delivered. Process payouts to transfer funds to vendor Stripe accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="commission" className="text-sm font-medium text-gray-700">
                  Commission %
                </label>
                <Input
                  id="commission"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                  disabled={commissionLoading}
                  className="w-24"
                />
              </div>
              <Button
                onClick={handleSaveCommission}
                disabled={commissionSaving || commissionLoading}
                variant="outline"
                className="border-gray-300 bg-white text-gray-700"
              >
                {commissionSaving ? "Saving..." : "Save"}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleProcessPayouts}
                disabled={processPayoutsLoading}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {processPayoutsLoading ? "Processing..." : "Process Payouts"}
              </Button>
              {payoutMessage && (
                <span className="text-sm text-gray-600">{payoutMessage}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overview Videos */}
        <Card className="mb-8 border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Video className="h-5 w-5" />
              Overview Tab Videos
            </CardTitle>
            <CardDescription className="text-gray-600">
              Set Google Drive (or other) video links for the Overview page. One link for &quot;How to Send Gifts&quot; and one for &quot;How to Register as Vendor&quot;. Paste the share link (e.g. https://drive.google.com/file/d/.../view).
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

        {/* Pending Store Approvals */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            Pending Store Approvals ({pendingStores.length})
          </h2>
          {pendingStores.length === 0 ? (
            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending store approvals at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingStores.map((store) => (
                <Card key={store.id} className="border border-gray-200 bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-gray-900">{store.name}</CardTitle>
                        <CardDescription className="text-gray-600">
                      {store.vendors?.business_name || store.vendors?.vendor_name}
                        </CardDescription>
                        {store.category && (
                          <Badge className="mt-2 border-gray-200 bg-white text-gray-600">
                            {store.category}
                          </Badge>
                        )}
                      </div>
                      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {store.description && (
                      <p className="text-gray-600 mb-4">{store.description}</p>
                    )}
                    <div className="space-y-2 mb-4 text-sm">
                      {(store.email || store.vendors?.email) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-gray-900 font-medium text-xs">{store.email || store.vendors?.email}</span>
                        </div>
                      )}
                      {(store.phone || store.vendors?.phone) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="text-gray-900 font-medium">{store.phone || store.vendors?.phone}</span>
                        </div>
                      )}
                      {(store.address || store.vendors?.address) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="text-gray-900 font-medium text-right text-xs">{store.address || store.vendors?.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveStore(store.id)}
                        disabled={actionLoading === store.id}
                        className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {actionLoading === store.id ? "..." : "Approve"}
                      </Button>
                      <Button
                        onClick={() => handleRejectStore(store.id)}
                        disabled={actionLoading === store.id}
                        variant="outline"
                        className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {actionLoading === store.id ? "..." : "Reject"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Suspended Stores */}
        {suspendedStores.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Ban className="h-6 w-6 text-red-600" />
              Suspended Stores ({suspendedStores.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suspendedStores.map((store) => (
                <Card key={store.id} className="border border-red-200 bg-red-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-gray-900">{store.name}</CardTitle>
                      <Badge className="bg-red-100 text-red-700 border-red-300">
                        <Ban className="h-3 w-3 mr-1" />
                        Suspended
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-600">
                      {store.category || "No category"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {store.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{store.description}</p>
                    )}
                    <div className="space-y-2 mb-4 text-sm">
                      {(store.email || store.vendors?.email) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-gray-900 font-medium text-xs">{store.email || store.vendors?.email}</span>
                        </div>
                      )}
                      {(store.phone || store.vendors?.phone) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="text-gray-900 font-medium">{store.phone || store.vendors?.phone}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleReactivateStore(store.id)}
                      disabled={actionLoading === store.id}
                      className="w-full border-2 border-green-300 bg-white text-green-700 hover:bg-green-50 hover:border-green-400 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {actionLoading === store.id ? "Reactivating..." : "Reactivate Store"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Approved Stores */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="h-6 w-6 text-gray-600" />
            Approved Stores ({approvedStores.length})
          </h2>
          {approvedStores.length === 0 ? (
            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-12 text-center">
                <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Approved Stores</h3>
                <p className="text-gray-600">No stores have been approved yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {paginatedStores.map((store) => (
                  <Card key={store.id} className="border border-gray-200 bg-white">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-gray-900">{store.name}</CardTitle>
                        {store.status === "suspended" ? (
                          <Badge className="bg-red-50 text-red-700 border-red-200">
                            Suspended
                          </Badge>
                        ) : (
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-gray-600">
                        {store.category || "No category"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {store.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{store.description}</p>
                      )}
                      <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/admin/store/${store.id}`)}
                          className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      >
                        View Details
                      </Button>
                        <Button
                          onClick={() => handleSuspendStore(store.id)}
                          disabled={actionLoading === store.id}
                          variant="outline"
                          className="border-2 border-orange-300 bg-white text-orange-600 hover:bg-orange-50 hover:border-orange-400 disabled:opacity-50"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className={
                          currentPage === page
                            ? "bg-primary text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

