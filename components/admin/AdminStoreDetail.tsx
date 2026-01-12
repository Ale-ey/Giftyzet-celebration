"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, DollarSign, ShoppingBag, Store, Calendar, XCircle, AlertTriangle } from "lucide-react"
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
import { getStores, getOrders, getVendors, saveStore } from "@/lib/vendor-data"
import { allProducts, allServices } from "@/lib/constants"
import type { Store as StoreType, Order, Vendor } from "@/types"

interface AdminStoreDetailProps {
  storeId: string
}

export default function AdminStoreDetail({ storeId }: AdminStoreDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreType | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [productCount, setProductCount] = useState(0)
  const [serviceCount, setServiceCount] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const stores = getStores()
    const foundStore = stores.find((s) => s.id === storeId)
    
    if (!foundStore) {
      router.push("/admin")
      return
    }

    setStore(foundStore)

    // Get vendor info
    const vendors = getVendors()
    const foundVendor = vendors.find((v) => v.id === foundStore.vendorId)
    setVendor(foundVendor || null)

    // Get orders for this vendor
    const allOrders = getOrders()
    const vendorOrders = allOrders.filter((o) => o.vendorId === foundStore.vendorId)
    setOrders(vendorOrders)
    setTotalOrders(vendorOrders.length)

    // Calculate total earnings
    const earnings = vendorOrders.reduce((sum, order) => sum + order.total, 0)
    setTotalEarnings(earnings)

    // Count products and services
    if (foundVendor) {
      const products = allProducts.filter((p) => p.vendor === foundVendor.vendorName)
      const services = allServices.filter((s) => s.vendor === foundVendor.vendorName)
      setProductCount(products.length)
      setServiceCount(services.length)
    }

    setLoading(false)
  }, [storeId, router])

  const handleSuspendStore = () => {
    if (!store) return
    
    const updatedStore: StoreType = {
      ...store,
      status: store.status === "suspended" ? "approved" : "suspended",
      suspendedAt: store.status === "suspended" ? undefined : new Date().toISOString()
    }
    saveStore(updatedStore)
    setStore(updatedStore)
    setShowConfirmModal(false)
    window.dispatchEvent(new Event("storesUpdated"))
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

        {/* Store Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{store.name}</h1>
              {vendor && (
                <p className="text-gray-600">Vendor: {vendor.name} ({vendor.email})</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge
                className={
                  store.status === "approved"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : store.status === "pending"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }
              >
                {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
              </Badge>
              {store.status !== "pending" && (
                <Button
                  onClick={() => setShowConfirmModal(true)}
                  variant="outline"
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
          {store.description && (
            <p className="text-gray-600 mb-4">{store.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {store.category && (
              <span>
                <strong>Category:</strong> {store.category}
              </span>
            )}
            {store.address && (
              <span>
                <strong>Address:</strong> {store.address}
              </span>
            )}
            {store.phone && (
              <span>
                <strong>Phone:</strong> {store.phone}
              </span>
            )}
            {store.email && (
              <span>
                <strong>Email:</strong> {store.email}
              </span>
            )}
            {store.createdAt && (
              <span>
                <strong>Created:</strong> {new Date(store.createdAt).toLocaleDateString()}
              </span>
            )}
            {store.approvedAt && (
              <span>
                <strong>Approved:</strong> {new Date(store.approvedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{productCount}</div>
              <p className="text-xs text-gray-500 mt-1">Products listed</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Total Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{serviceCount}</div>
              <p className="text-xs text-gray-500 mt-1">Services listed</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">From all orders</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalOrders}</div>
              <p className="text-xs text-gray-500 mt-1">All time orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Breakdown */}
        <Card className="border border-gray-200 bg-white mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Order Status Breakdown</CardTitle>
            <CardDescription className="text-gray-600">
              Overview of orders by status
            </CardDescription>
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

        {/* Recent Orders */}
        <Card className="border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Orders</CardTitle>
            <CardDescription className="text-gray-600">
              Latest orders from this store
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 10).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {order.customerName} • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                      <Badge
                        className={
                          order.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : order.status === "confirmed"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : order.status === "dispatched"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : order.status === "delivered"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Modal */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                {store.status === "suspended" ? "Unsuspend Store" : "Suspend Store"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {store.status === "suspended" ? (
                  <>
                    Are you sure you want to unsuspend <strong>{store.name}</strong>? 
                    The store will be able to operate normally again.
                  </>
                ) : (
                  <>
                    Are you sure you want to suspend <strong>{store.name}</strong>? 
                    This will prevent the store from operating and may affect existing orders.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSuspendStore}
                className={
                  store.status === "suspended"
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-red-600 text-white hover:bg-red-700"
                }
              >
                {store.status === "suspended" ? "Unsuspend" : "Suspend"} Store
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

