"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, DollarSign, ShoppingBag, Store, XCircle, AlertTriangle, CheckCircle2, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { supabase } from "@/lib/supabase/client"

interface AdminStoreDetailProps {
  storeId: string
}

type StoreRow = {
  id: string
  name: string
  description: string | null
  status: string
  vendor_id: string
  address: string | null
  phone: string | null
  email: string | null
  category: string | null
  created_at: string
  approved_at: string | null
  suspended_at: string | null
  vendors?: { id: string; vendor_name: string; email: string | null } | null
}

type OrderRow = {
  id: string
  order_number: string
  total: number
  status: string
  created_at: string
  sender_name?: string
}

export default function AdminStoreDetail({ storeId }: AdminStoreDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreRow | null>(null)
  const [productCount, setProductCount] = useState(0)
  const [serviceCount, setServiceCount] = useState(0)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          if (!cancelled) router.push("/admin")
          return
        }
        const res = await fetch(`/api/admin/stores/${encodeURIComponent(storeId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (cancelled) return
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          if (res.status === 401 || res.status === 404) {
            router.push("/admin")
            return
          }
          throw new Error(err.error ?? "Failed to load store")
        }
        const json = await res.json()
        if (cancelled) return
        if (!json.store) {
          router.push("/admin")
          return
        }
        setStore(json.store as StoreRow)
        setProductCount(json.productCount ?? 0)
        setServiceCount(json.serviceCount ?? 0)
        setOrders((json.orders ?? []) as OrderRow[])
        setTotalEarnings(Number(json.totalEarnings ?? 0))
      } catch {
        if (!cancelled) router.push("/admin")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [storeId, router])

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    }
  }

  const handleSuspendStore = async () => {
    if (!store) return
    setActionLoading(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/admin/stores/${encodeURIComponent(store.id)}/suspend`, {
        method: "POST",
        headers,
        body: JSON.stringify({ unsuspend: store.status === "suspended" }),
      })
      const data = await res.json().catch(() => ({}))
      setShowConfirmModal(false)
      if (!res.ok) {
        showToast(data.error ?? "Failed to update store.", "error")
        return
      }
      showToast(store.status === "suspended" ? "Store reactivated." : "Store suspended.", "success")
      setStore((s) =>
        s
          ? {
              ...s,
              status: s.status === "suspended" ? "approved" : "suspended",
              suspended_at: s.status === "suspended" ? null : new Date().toISOString(),
            }
          : null
      )
    } catch (e) {
      console.error(e)
      showToast("Failed to update store. Please try again.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!store) {
    return null
  }

  const vendor = store.vendors
  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const confirmedOrders = orders.filter((o) => o.status === "confirmed").length
  const dispatchedOrders = orders.filter((o) => o.status === "dispatched").length
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin")}
          className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{store.name}</h1>
              {vendor && (
                <p className="text-gray-600">Vendor: {vendor.vendor_name} {vendor.email && `(${vendor.email})`}</p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                className={
                  store.status === "approved"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : store.status === "pending"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : store.status === "rejected"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }
              >
                {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
              </Badge>
              {store.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    onClick={async () => {
                      setActionLoading(true)
                      try {
                        const headers = await getAuthHeaders()
                        const res = await fetch(`/api/admin/stores/${encodeURIComponent(store.id)}/approve`, { method: "POST", headers })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok) {
                          showToast(data.error ?? "Failed to approve store.", "error")
                          return
                        }
                        showToast("Store approved.", "success")
                        setStore((s) => (s ? { ...s, status: "approved", approved_at: new Date().toISOString() } : null))
                      } catch (e) {
                        console.error(e)
                        showToast("Failed to approve store. Please try again.", "error")
                      } finally {
                        setActionLoading(false)
                      }
                    }}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3 mr-1" />
                    {actionLoading ? "..." : "Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                  >
                    <X className="h-3.5 w-3 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              {store.status !== "pending" && store.status !== "rejected" && (
                <Button
                  onClick={() => setShowConfirmModal(true)}
                  variant="outline"
                  disabled={actionLoading}
                  className={
                    store.status === "suspended"
                      ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      : "border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300"
                  }
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {store.status === "suspended" ? "Unsuspend Store" : "Suspend Store"}
                </Button>
              )}
            </div>
          </div>
          {store.description && <p className="text-gray-600 mb-4">{store.description}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {store.category && <span><strong>Category:</strong> {store.category}</span>}
            {store.address && <span><strong>Address:</strong> {store.address}</span>}
            {store.phone && <span><strong>Phone:</strong> {store.phone}</span>}
            {store.email && <span><strong>Email:</strong> {store.email}</span>}
            {store.created_at && <span><strong>Created:</strong> {new Date(store.created_at).toLocaleDateString()}</span>}
            {store.approved_at && <span><strong>Approved:</strong> {new Date(store.approved_at).toLocaleDateString()}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="h-4 w-4" /> Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{productCount}</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Store className="h-4 w-4" /> Total Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{serviceCount}</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{orders.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 bg-white mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Order status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{pendingOrders}</div>
                <div className="text-sm text-yellow-600 mt-1">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{confirmedOrders}</div>
                <div className="text-sm text-blue-600 mt-1">Confirmed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">{dispatchedOrders}</div>
                <div className="text-sm text-purple-600 mt-1">Dispatched</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{deliveredOrders}</div>
                <div className="text-sm text-green-600 mt-1">Delivered</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent orders</CardTitle>
            <CardDescription className="text-gray-600">Orders for this store</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No orders yet</div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">#{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        {order.sender_name ?? "—"} · {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${Number(order.total).toFixed(2)}</p>
                      <Badge className="bg-gray-100 text-gray-700 border-gray-200">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                {store.status === "suspended" ? "Unsuspend Store" : "Suspend Store"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {store.status === "suspended"
                  ? `Unsuspend ${store.name}? The store will operate normally again.`
                  : `Suspend ${store.name}? This will prevent the store from operating.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button onClick={handleSuspendStore} disabled={actionLoading} className={store.status === "suspended" ? "bg-primary text-white hover:bg-primary/90" : "bg-red-600 text-white hover:bg-red-700"}>
                {actionLoading ? "..." : store.status === "suspended" ? "Unsuspend" : "Suspend"} Store
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Reject store application
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Reject {store.name}? The vendor can resubmit later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectModal(false)} className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setActionLoading(true)
                  try {
                    const headers = await getAuthHeaders()
                    const res = await fetch(`/api/admin/stores/${encodeURIComponent(store.id)}/reject`, { method: "POST", headers })
                    const data = await res.json().catch(() => ({}))
                    setShowRejectModal(false)
                    if (!res.ok) {
                      showToast(data.error ?? "Failed to reject store.", "error")
                      return
                    }
                    showToast("Store rejected.", "success")
                    setStore((s) => (s ? { ...s, status: "rejected" } : null))
                  } catch (e) {
                    console.error(e)
                    showToast("Failed to reject store. Please try again.", "error")
                  } finally {
                    setActionLoading(false)
                  }
                }}
                disabled={actionLoading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {actionLoading ? "..." : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
