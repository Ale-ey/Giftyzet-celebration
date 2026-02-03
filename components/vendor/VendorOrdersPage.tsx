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
        
        // Transform the data to match the expected format (services: quantity = hours, price = per hour)
        const formattedOrders = vendorOrders.map((vo: any) => ({
          id: vo.orders.id,
          orderNumber: vo.orders.order_number,
          customerName: vo.orders.sender_name,
          customerEmail: vo.orders.sender_email,
          status: vo.status,
          total: parseFloat(vo.orders.total),
          orderType: vo.orders.order_type,
          senderName: vo.orders.sender_name,
          senderEmail: vo.orders.sender_email,
          senderPhone: vo.orders.sender_phone,
          senderAddress: vo.orders.sender_address,
          receiverName: vo.orders.receiver_name,
          receiverEmail: vo.orders.receiver_email,
          receiverPhone: vo.orders.receiver_phone,
          receiverAddress: vo.orders.receiver_address,
          shippingAddress: vo.orders.shipping_address,
          items: vo.orders.order_items?.map((item: any) => {
            const qty = item.quantity ?? 1
            const unitPrice = parseFloat(item.price) || 0
            const lineTotal = unitPrice * qty
            const isService = item.item_type === "service"
            return {
              name: item.name,
              type: item.item_type,
              quantity: qty,
              price: `$${lineTotal.toFixed(2)}`,
              pricePerUnit: unitPrice,
              image: item.image_url,
              product_id: item.product_id,
              service_id: item.service_id,
              isService,
              hours: isService ? qty : null
            }
          }) || [],
          createdAt: vo.orders.created_at,
          confirmedAt: vo.orders.confirmed_at,
          dispatchedAt: vo.orders.dispatched_at,
          deliveredAt: vo.orders.delivered_at,
          fullOrder: vo.orders
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

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "dispatched", label: "Dispatched" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" }
  ]

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

        {/* Filter dropdown */}
        <div className="flex items-center gap-4 mb-6">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-w-[160px]"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} {opt.value === "all" ? `(${orders.length})` : `(${orders.filter((o) => o.status === opt.value).length})`}
              </option>
            ))}
          </select>
        </div>

        {/* Orders Table */}
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
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Order #</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Items</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Total</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.customerName}
                        <br />
                        <span className="text-xs text-gray-500">{order.customerEmail}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.items.length} item(s)
                        {order.items.some((i: any) => i.isService) && (
                          <span className="block text-xs text-gray-500 mt-0.5">
                            {order.items.filter((i: any) => i.isService).map((i: any) => `${i.hours}h`).join(", ")} service
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">${order.total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => {
                            e.stopPropagation()
                            const newStatus = e.target.value
                            if (newStatus !== order.status) {
                              handleStatusUpdate(order.id, newStatus)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrder(order)
                            setIsOrderModalOpen(true)
                          }}
                          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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

