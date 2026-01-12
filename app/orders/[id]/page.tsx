"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Package, CheckCircle, Truck, MapPin, Phone, Mail, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrderById } from "@/lib/api/orders"

export default function ViewOrderPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true)
        const data = await getOrderById(orderId)
        setOrder(data)
      } catch (err: any) {
        console.error('Error loading order:', err)
        setError(err.message || 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      loadOrder()
    }
  }, [orderId])

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />
      case 'dispatched':
        return <Truck className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This order does not exist or you do not have permission to view it.'}</p>
            <Button onClick={() => router.push('/marketplace')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-gray-900 hover:text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600 mt-1">Order #{order.order_number}</p>
            </div>
            <Badge className={`${getStatusColor(order.status)} text-white px-4 py-2 flex items-center gap-2`}>
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Order Items
                </h2>
                <div className="space-y-4">
                  {order.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{item.item_type}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                          <span className="font-semibold text-gray-900">${parseFloat(item.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Information
                </h2>
                
                {/* Order Type Badge */}
                <div className="mb-4">
                  <Badge className={order.order_type === 'gift' 
                    ? 'bg-primary/10 text-primary border-primary/20 text-base px-3 py-1' 
                    : 'bg-gray-100 text-gray-700 border-gray-200 text-base px-3 py-1'
                  }>
                    {order.order_type === 'gift' ? '🎁 Gift Order' : '📦 Self Order'}
                  </Badge>
                </div>

                {order.order_type === 'gift' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sender Info */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Sender (Orderer)
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium mb-1">Name</p>
                          <p className="text-gray-900">{order.sender_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium mb-1">Email</p>
                          <p className="text-gray-900 flex items-center">
                            <Mail className="h-3 w-3 mr-2" />
                            {order.sender_email}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium mb-1">Phone</p>
                          <p className="text-gray-900 flex items-center">
                            <Phone className="h-3 w-3 mr-2" />
                            {order.sender_phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium mb-1">Address</p>
                          <p className="text-gray-900 whitespace-pre-line">{order.sender_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Receiver Info (Ship To) */}
                    <div className={`p-4 rounded-lg border ${
                      order.receiver_address 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Receiver (Ship To)
                      </h3>
                      {order.receiver_address ? (
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-gray-600 font-medium mb-1">Name</p>
                            <p className="text-gray-900">{order.receiver_name || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium mb-1">Email</p>
                            <p className="text-gray-900 flex items-center">
                              <Mail className="h-3 w-3 mr-2" />
                              {order.receiver_email || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium mb-1">Phone</p>
                            <p className="text-gray-900 flex items-center">
                              <Phone className="h-3 w-3 mr-2" />
                              {order.receiver_phone || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium mb-1">Shipping Address</p>
                            <p className="text-gray-900 whitespace-pre-line">{order.receiver_address}</p>
                          </div>
                          <div className="mt-3 pt-3 border-t border-green-300">
                            <p className="text-green-700 font-semibold text-xs">✓ Address Confirmed - Ready to Ship</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-yellow-700 italic">
                            ⏳ Waiting for receiver to provide shipping address
                          </p>
                          <div className="text-xs text-yellow-600 mt-3">
                            <p className="font-medium mb-1">Gift link sent to:</p>
                            <p>{order.receiver_email || 'Receiver email pending'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Ship To (Customer)
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium mb-1">Name</p>
                        <p className="text-gray-900">{order.sender_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium mb-1">Email</p>
                        <p className="text-gray-900 flex items-center">
                          <Mail className="h-3 w-3 mr-2" />
                          {order.sender_email}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium mb-1">Phone</p>
                        <p className="text-gray-900 flex items-center">
                          <Phone className="h-3 w-3 mr-2" />
                          {order.sender_phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium mb-1">Shipping Address</p>
                        <p className="text-gray-900 whitespace-pre-line">
                          {order.shipping_address || order.sender_address}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm sticky top-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Type</span>
                    <Badge variant="outline" className="capitalize">
                      {order.order_type}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {order.confirmed_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Confirmed</span>
                      <span className="font-medium text-gray-900">
                        {new Date(order.confirmed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">${parseFloat(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">${parseFloat(order.shipping || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">${parseFloat(order.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-primary">${parseFloat(order.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Payment Status</span>
                    <Badge className={order.payment_status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}>
                      {order.payment_status}
                    </Badge>
                  </div>
                  {order.payment_method && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payment Method</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{order.payment_method}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
