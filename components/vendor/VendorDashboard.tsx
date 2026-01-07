"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Store, 
  Package, 
  ShoppingBag, 
  Settings,
  DollarSign
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getStoreByVendorId, getOrdersByVendorId } from "@/lib/vendor-data"
import type { Store as StoreType, Order } from "@/types"

export default function VendorDashboard() {
  const router = useRouter()
  const [store, setStore] = useState<StoreType | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Get vendor ID from vendors list, or create if doesn't exist
    const { getVendors, saveVendor, saveStore } = require("@/lib/vendor-data")
    const vendors = getVendors()
    
    // Use first vendor if exists, or create a demo vendor
    let vendor = vendors[0]
    
    if (!vendor) {
      const vendorId = `vendor-${Date.now()}`
      vendor = {
        id: vendorId,
        email: "demo@vendor.com",
        name: "Demo Vendor",
        vendorName: "Demo Store",
        role: "vendor" as const,
        createdAt: new Date().toISOString()
      }
      saveVendor(vendor)
      
      // Create store with approved status
      const store = {
        id: `store-${Date.now()}`,
        vendorId,
        name: "Demo Store",
        status: "approved" as const,
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      }
      saveStore(store)
    } else {
      // Ensure store is approved
      const vendorStore = getStoreByVendorId(vendor.id)
      if (vendorStore && vendorStore.status !== "approved") {
        const updatedStore = {
          ...vendorStore,
          status: "approved" as const,
          approvedAt: vendorStore.approvedAt || new Date().toISOString()
        }
        saveStore(updatedStore)
      }
    }

    let vendorStore = getStoreByVendorId(vendor.id)
    
    // Ensure store exists and is approved
    if (!vendorStore) {
      vendorStore = {
        id: `store-${Date.now()}`,
        vendorId: vendor.id,
        name: vendor.vendorName,
        status: "approved" as const,
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      }
      saveStore(vendorStore)
    } else if (vendorStore.status !== "approved") {
      vendorStore = {
        ...vendorStore,
        status: "approved" as const,
        approvedAt: vendorStore.approvedAt || new Date().toISOString()
      }
      saveStore(vendorStore)
    }
    
    setStore(vendorStore)

    const vendorOrders = getOrdersByVendorId(vendor.id)
    setOrders(vendorOrders)

    // Calculate revenue and orders
    const allRevenue = vendorOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0)
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyOrders = vendorOrders.filter((o) => {
      const orderDate = new Date(o.createdAt)
      return orderDate >= startOfMonth && o.status !== "cancelled"
    })
    const monthlyRev = monthlyOrders.reduce((sum, o) => sum + o.total, 0)

    setTotalRevenue(allRevenue)
    setMonthlyRevenue(monthlyRev)
    setTotalOrders(vendorOrders.length)

    setLoading(false)

    // Listen for updates
    const handleUpdate = () => {
      const updatedStore = getStoreByVendorId(vendor.id)
      setStore(updatedStore || null)
      const updatedOrders = getOrdersByVendorId(vendor.id)
      setOrders(updatedOrders)
      
      // Recalculate revenue
      const allRev = updatedOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total, 0)
      
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyOrders = updatedOrders.filter((o) => {
        const orderDate = new Date(o.createdAt)
        return orderDate >= startOfMonth && o.status !== "cancelled"
      })
      const monthlyRev = monthlyOrders.reduce((sum, o) => sum + o.total, 0)

      setTotalRevenue(allRev)
      setMonthlyRevenue(monthlyRev)
      setTotalOrders(updatedOrders.length)
    }

    window.addEventListener("storesUpdated", handleUpdate)
    window.addEventListener("ordersUpdated", handleUpdate)

    return () => {
      window.removeEventListener("storesUpdated", handleUpdate)
      window.removeEventListener("ordersUpdated", handleUpdate)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <Card className="border border-gray-200 bg-white max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Store Found</h2>
              <p className="text-gray-600 mb-6">
                Please contact support to set up your store.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const confirmedOrders = orders.filter((o) => o.status === "confirmed").length
  const dispatchedOrders = orders.filter((o) => o.status === "dispatched").length

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Dashboard</h1>
          <p className="text-gray-600">Manage your store, products, and orders</p>
        </div>

        {/* Revenue and Order Stats */}
        {store.status === "approved" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Revenue This Month</p>
                    <p className="text-2xl font-bold text-gray-900">${monthlyRevenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Order Status Stats */}
        {store.status === "approved" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{pendingOrders}</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Confirmed Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{confirmedOrders}</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Dispatched Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{dispatchedOrders}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        {store.status === "approved" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/vendor/store")}
            >
              <CardHeader>
                <Settings className="h-8 w-8 text-gray-600 mb-2" />
                <CardTitle className="text-gray-900">Store Setup</CardTitle>
                <CardDescription className="text-gray-600">
                  Configure your store details and settings
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/vendor/products")}
            >
              <CardHeader>
                <Package className="h-8 w-8 text-gray-600 mb-2" />
                <CardTitle className="text-gray-900">Products & Services</CardTitle>
                <CardDescription className="text-gray-600">
                  Add and manage your products and services
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/vendor/orders")}
            >
              <CardHeader>
                <ShoppingBag className="h-8 w-8 text-gray-600 mb-2" />
                <CardTitle className="text-gray-900">Orders</CardTitle>
                <CardDescription className="text-gray-600">
                  View and manage customer orders
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

