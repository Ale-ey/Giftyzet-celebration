"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Truck, Package, Clock, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getStoreByVendorId, getOrdersByVendorId, updateOrderStatus } from "@/lib/vendor-data"
import type { Store, Order } from "@/types"

export default function VendorOrdersPage() {
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Order["status"] | "all">("all")

  useEffect(() => {
    if (typeof window === "undefined") return

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
      
      // Create store with approved status for testing
      const store = {
        id: `store-${Date.now()}`,
        vendorId,
        name: "Demo Store",
        status: "approved" as const,
        createdAt: new Date().toISOString()
      }
      saveStore(store)
    }

    const vendorStore = getStoreByVendorId(vendor.id)
    setStore(vendorStore || null)
    const vendorOrders = getOrdersByVendorId(vendor.id)
    setOrders(vendorOrders)
    setLoading(false)

    // Listen for updates
    const handleUpdate = () => {
      const updatedOrders = getOrdersByVendorId(vendor.id)
      setOrders(updatedOrders)
    }

    window.addEventListener("ordersUpdated", handleUpdate)

    return () => {
      window.removeEventListener("ordersUpdated", handleUpdate)
    }
  }, [router])

  const handleStatusUpdate = (orderId: string, newStatus: Order["status"]) => {
    updateOrderStatus(orderId, newStatus)
    const updatedOrders = orders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    )
    setOrders(updatedOrders)
  }

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter((o) => o.status === filter)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "confirmed":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        )
      case "dispatched":
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200">
            <Truck className="h-3 w-3 mr-1" />
            Dispatched
          </Badge>
        )
      case "delivered":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            <Package className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
    }
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
          <p className="text-gray-600">Manage and track customer orders</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" 
              ? "bg-primary text-white" 
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }
          >
            All ({orders.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className={filter === "pending" 
              ? "bg-primary text-white" 
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }
          >
            Pending ({orders.filter((o) => o.status === "pending").length})
          </Button>
          <Button
            variant={filter === "confirmed" ? "default" : "outline"}
            onClick={() => setFilter("confirmed")}
            className={filter === "confirmed" 
              ? "bg-primary text-white" 
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }
          >
            Confirmed ({orders.filter((o) => o.status === "confirmed").length})
          </Button>
          <Button
            variant={filter === "dispatched" ? "default" : "outline"}
            onClick={() => setFilter("dispatched")}
            className={filter === "dispatched" 
              ? "bg-primary text-white" 
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }
          >
            Dispatched ({orders.filter((o) => o.status === "dispatched").length})
          </Button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600">
                {filter === "all" 
                  ? "You don't have any orders yet. Orders will appear here once customers place them."
                  : `No ${filter} orders at the moment.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border border-gray-200 bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-gray-900">Order #{order.orderNumber}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {order.customerName} ({order.customerEmail})
                      </CardDescription>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Items:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-600">
                                  {item.type === "product" ? "Product" : "Service"} • Qty: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-gray-900">{item.price}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-gray-900">${order.total.toFixed(2)}</span>
                    </div>

                    {/* Order Date */}
                    <p className="text-sm text-gray-600">
                      Ordered: {new Date(order.createdAt).toLocaleDateString()}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      {order.status === "pending" && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, "confirmed")}
                          className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirm Order
                        </Button>
                      )}
                      {order.status === "confirmed" && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, "dispatched")}
                          className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Mark as Dispatched
                        </Button>
                      )}
                      {order.status === "dispatched" && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, "delivered")}
                          className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Mark as Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

