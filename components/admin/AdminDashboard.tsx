"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Store, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Users,
  ShoppingBag,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  getPendingStores, 
  getApprovedStores, 
  getStores, 
  saveStore,
  getOrders,
  getVendors,
  saveVendor
} from "@/lib/vendor-data"
import type { Store as StoreType, Order, Vendor } from "@/types"

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pendingStores, setPendingStores] = useState<StoreType[]>([])
  const [approvedStores, setApprovedStores] = useState<StoreType[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    if (typeof window === "undefined") return

    // Create demo store if none exists
    const stores = getStores()
    
    if (stores.length === 0) {
      // Create demo vendor
      const vendors = getVendors()
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
      }
      
      // Create demo store with approved status
      const store = {
        id: `store-${Date.now()}`,
        vendorId: vendor.id,
        name: "Demo Store",
        status: "approved" as const,
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      }
      saveStore(store)
    }

    // Load data - no auth check for now
    const pending = getPendingStores()
    const approved = getApprovedStores()
    const allOrders = getOrders()

    setPendingStores(pending)
    setApprovedStores(approved)
    setOrders(allOrders)
    setLoading(false)

    // Listen for updates
    const handleUpdate = () => {
      setPendingStores(getPendingStores())
      setApprovedStores(getApprovedStores())
      setOrders(getOrders())
    }

    window.addEventListener("storesUpdated", handleUpdate)
    window.addEventListener("ordersUpdated", handleUpdate)

    return () => {
      window.removeEventListener("storesUpdated", handleUpdate)
      window.removeEventListener("ordersUpdated", handleUpdate)
    }
  }, [router])

  const handleApproveStore = (storeId: string) => {
    const stores = getStores()
    const store = stores.find((s) => s.id === storeId)
    if (store) {
      const updatedStore: StoreType = {
        ...store,
        status: "approved",
        approvedAt: new Date().toISOString()
      }
      saveStore(updatedStore)
      setPendingStores(getPendingStores())
      setApprovedStores(getApprovedStores())
    }
  }

  const handleSuspendStore = (storeId: string) => {
    const stores = getStores()
    const store = stores.find((s) => s.id === storeId)
    if (store) {
      const updatedStore: StoreType = {
        ...store,
        status: store.status === "suspended" ? "approved" : "suspended",
        suspendedAt: store.status === "suspended" ? undefined : new Date().toISOString()
      }
      saveStore(updatedStore)
      setPendingStores(getPendingStores())
      setApprovedStores(getApprovedStores())
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const totalStores = approvedStores.length
  const pendingCount = pendingStores.length
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage vendors, stores, and monitor platform activity</p>
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
                          Vendor ID: {store.vendorId}
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
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveStore(store.id)}
                        className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve Store
                      </Button>
                      <Button
                        onClick={() => handleSuspendStore(store.id)}
                        variant="outline"
                        className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-red-600"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

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
                      <Button
                        onClick={() => router.push(`/admin/store/${store.id}`)}
                        className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      >
                        View Details
                      </Button>
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

