"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Truck, Package, Clock, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { getCurrentUserWithProfile } from "@/lib/api/auth"
import { getOrdersByVendorId, updateVendorOrderStatus } from "@/lib/api/orders"
import { useToast } from "@/components/ui/toast"
import OrderDetailModal from "./OrderDetailModal"
import type { Store, Order } from "@/types"

export default function VendorOrdersPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [store, setStore] = useState<Store | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const itemsPerPage = 10

  useEffect(() => {
    async function loadVendorOrders() {
      try {
        setLoading(true)
        
        // Get current user with profile
        const userProfile = await getCurrentUserWithProfile()
        
        if (!userProfile || userProfile.role !== 'vendor') {
          showToast("You must be logged in as a vendor to view orders", "error")
          router.push('/auth/login')
          return
        }

        // Get vendor record from vendors table
        const { supabase } = await import('@/lib/supabase/client')
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', userProfile.id)
          .single()

        if (vendorError || !vendorData) {
          showToast("Vendor profile not found", "error")
          console.error('Vendor error:', vendorError)
          setLoading(false)
          return
        }

        setVendorId(vendorData.id)

        // Fetch vendor orders from API
        const vendorOrders = await getOrdersByVendorId(vendorData.id)
        
        // Transform the data to match the expected format
        const formattedOrders = vendorOrders.map((vo: any) => ({
          id: vo.orders.id,
          orderNumber: vo.orders.order_number,
          customerName: vo.orders.sender_name,
          customerEmail: vo.orders.sender_email,
          status: vo.status,
          total: parseFloat(vo.orders.total),
          orderType: vo.orders.order_type,
          // Sender details
          senderName: vo.orders.sender_name,
          senderEmail: vo.orders.sender_email,
          senderPhone: vo.orders.sender_phone,
          senderAddress: vo.orders.sender_address,
          // Receiver details (for gift orders)
          receiverName: vo.orders.receiver_name,
          receiverEmail: vo.orders.receiver_email,
          receiverPhone: vo.orders.receiver_phone,
          receiverAddress: vo.orders.receiver_address,
          // Shipping address (for self orders)
          shippingAddress: vo.orders.shipping_address,
          items: vo.orders.order_items?.map((item: any) => ({
            name: item.name,
            type: item.item_type,
            quantity: item.quantity,
            price: `$${parseFloat(item.price).toFixed(2)}`,
            image: item.image_url
          })) || [],
          createdAt: vo.orders.created_at,
          confirmedAt: vo.orders.confirmed_at,
          dispatchedAt: vo.orders.dispatched_at,
          deliveredAt: vo.orders.delivered_at,
          fullOrder: vo.orders // Keep full order data for modal
        }))

        setOrders(formattedOrders)
        setLoading(false)
      } catch (error: any) {
        console.error('Error loading vendor orders:', error)
        showToast(error.message || "Failed to load orders", "error")
        setLoading(false)
      }
    }

    loadVendorOrders()

    // Listen for updates
    const handleUpdate = () => {
      loadVendorOrders()
    }

    window.addEventListener("ordersUpdated", handleUpdate)

    return () => {
      window.removeEventListener("ordersUpdated", handleUpdate)
    }
  }, [router, showToast])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!vendorId) return
    
    try {
      await updateVendorOrderStatus(orderId, vendorId, newStatus as any)
      const updatedOrders = orders.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      )
      setOrders(updatedOrders)
      showToast(`Order status updated to ${newStatus}`, "success")
    } catch (error: any) {
      console.error('Error updating order status:', error)
      showToast(error.message || "Failed to update order status", "error")
    }
  }

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter((o) => o.status?.toLowerCase() === filter.toLowerCase())

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
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
          onClick={() => router.push("/vendor/dashboard")}
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
            onClick={() => handleFilterChange("all")}
            className={filter === "all" 
              ? "bg-primary text-white" 
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }
          >
            All ({orders.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => handleFilterChange("pending")}
            className={filter === "pending" 
              ? "bg-primary text-white" 
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }
          >
            Pending ({orders.filter((o) => o.status === "pending").length})
          </Button>
          <Button
            variant={filter === "confirmed" ? "default" : "outline"}
            onClick={() => handleFilterChange("confirmed")}
            className={filter === "confirmed" 
              ? "bg-primary text-white" 
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }
          >
            Confirmed ({orders.filter((o) => o.status === "confirmed").length})
          </Button>
          <Button
            variant={filter === "dispatched" ? "default" : "outline"}
            onClick={() => handleFilterChange("dispatched")}
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
          <>
            <div className="space-y-4">
              {paginatedOrders.map((order) => (
              <Card 
                key={order.id} 
                className="border border-gray-200 bg-white cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedOrder(order)
                  setIsOrderModalOpen(true)
                }}
              >
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
                    {/* Order Items Preview */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Items ({order.items.length}):</h4>
                      <div className="space-y-2">
                        {order.items.slice(0, 2).map((item, idx) => (
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
                        {order.items.length > 2 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            +{order.items.length - 2} more item(s) - Click to view details
                          </p>
                        )}
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

                    {/* Click hint */}
                    <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                      Click anywhere on this card to view full order details
                    </p>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredOrders.length}
            />
          </>
        )}

        {/* Order Detail Modal */}
        <OrderDetailModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false)
            setSelectedOrder(null)
          }}
          order={selectedOrder}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </div>
  )
}

