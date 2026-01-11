"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, Eye, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/api/auth"
import { getOrdersByUserId } from "@/lib/api/orders"

export default function MyOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true)
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
          router.push('/auth/login')
          return
        }

        setUser(currentUser)
        const userOrders = await getOrdersByUserId(currentUser.id)
        setOrders(userOrders)
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()

    // Listen for order updates
    const handleOrdersUpdate = () => {
      loadOrders()
    }

    window.addEventListener('ordersUpdated', handleOrdersUpdate)
    return () => window.removeEventListener('ordersUpdated', handleOrdersUpdate)
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500'
      case 'dispatched':
        return 'bg-blue-500'
      case 'confirmed':
        return 'bg-yellow-500'
      case 'pending':
        return 'bg-orange-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Button
                onClick={() => router.push("/marketplace")}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">View and track all your orders</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Order #{order.order_number}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(order.status)} text-white capitalize`}>
                      {order.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {order.order_type}
                    </Badge>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="space-y-3">
                    {order.order_items?.slice(0, 2).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded border border-gray-200 flex-shrink-0 bg-gray-50">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">${parseFloat(item.price).toFixed(2)}</p>
                      </div>
                    ))}
                    {order.order_items && order.order_items.length > 2 && (
                      <p className="text-sm text-gray-600">
                        +{order.order_items.length - 2} more item{order.order_items.length - 2 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Total and Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-primary">${parseFloat(order.total).toFixed(2)}</p>
                  </div>
                  <Button
                    onClick={() => router.push(`/orders/${order.id}`)}
                    variant="outline"
                    className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
