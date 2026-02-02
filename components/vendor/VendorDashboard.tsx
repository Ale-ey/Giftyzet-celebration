"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Store, 
  Package, 
  ShoppingBag, 
  Settings,
  DollarSign,
  AlertTriangle,
  Wallet
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getCurrentUser } from "@/lib/api/auth"
import { getVendorByUserId, getStoreByVendorId } from "@/lib/api/vendors"
import { getOrdersByVendorId } from "@/lib/api/orders"

export default function VendorDashboard() {
  const router = useRouter()
  const [store, setStore] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [isSuspended, setIsSuspended] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/")
        return
      }

      const vendor = await getVendorByUserId(user.id)
      if (!vendor) {
        router.push("/vendor/register-store")
        return
      }

      // Check store status
      const vendorStore = await getStoreByVendorId(vendor.id)
      
      // If no store or store is pending/rejected, redirect to registration
      if (!vendorStore || vendorStore.status === "pending" || vendorStore.status === "rejected") {
        router.push("/vendor/register-store")
        return
      }

      // If store is suspended, show dialog
      if (vendorStore.status === "suspended") {
        setStore(vendorStore)
        setIsSuspended(true)
        setLoading(false)
        return
      }

      // If store is approved, load dashboard data
      if (vendorStore.status === "approved") {
        setStore(vendorStore)
        setIsSuspended(false)
        
        // Load orders
        try {
          const vendorOrdersData = await getOrdersByVendorId(vendor.id)
          // Transform vendor orders data to match expected format
          const vendorOrders = (vendorOrdersData || []).map((vo: any) => {
            const order = vo.orders || {}
            return {
              id: order.id,
              order_number: order.order_number,
              status: vo.status || order.status,
              total: parseFloat(order.total || 0),
              created_at: order.created_at || order.createdAt,
              createdAt: order.created_at || order.createdAt,
              items: vo.orders?.order_items || []
            }
          })
          setOrders(vendorOrders)

          // Calculate revenue and orders
          const allRevenue = vendorOrders
            .filter((o: any) => o.status !== "cancelled")
            .reduce((sum: number, o: any) => sum + (o.total || 0), 0)
          
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthlyOrders = vendorOrders.filter((o: any) => {
            const orderDate = new Date(o.created_at || o.createdAt)
            return orderDate >= startOfMonth && o.status !== "cancelled"
          })
          const monthlyRev = monthlyOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)

          setTotalRevenue(allRevenue)
          setMonthlyRevenue(monthlyRev)
          setTotalOrders(vendorOrders.length)
        } catch (error) {
          console.error("Error loading orders:", error)
        }
      }
    } catch (error: any) {
      console.error("Error loading dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return null // Will redirect to registration
  }

  // If store is suspended, show suspension dialog
  if (isSuspended) {
    return (
      <>
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-2 border-red-300 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Store Suspended</CardTitle>
              </div>
              <CardDescription className="text-gray-700 text-base">
                Your store has been suspended due to suspicious activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Please contact our support team for more information and to resolve this issue.
              </p>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600 mb-1">Contact Support:</p>
                <a 
                  href="mailto:help@giftyzel.com" 
                  className="text-primary font-semibold hover:underline"
                >
                  help@giftyzel.com
                </a>
              </div>
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const pendingOrders = orders.filter((o: any) => o.status === "pending").length
  const confirmedOrders = orders.filter((o: any) => o.status === "confirmed").length
  const dispatchedOrders = orders.filter((o: any) => o.status === "dispatched").length

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Dashboard</h1>
          <p className="text-gray-600">Manage your store, products, and orders</p>
        </div>

        {/* Revenue and Order Stats */}
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

        {/* Order Status Stats */}
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

        {/* Quick Actions */}
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

          <Card className="border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/vendor/payouts")}
          >
            <CardHeader>
              <Wallet className="h-8 w-8 text-gray-600 mb-2" />
              <CardTitle className="text-gray-900">Payouts</CardTitle>
              <CardDescription className="text-gray-600">
                View pending and received payouts
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
