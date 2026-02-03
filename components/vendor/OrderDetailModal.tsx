"use client"

import { X, Package, Truck, CheckCircle2, Clock, MapPin, User, Gift } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Order } from "@/types"

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  onStatusUpdate?: (orderId: string, status: Order["status"]) => void
}

export default function OrderDetailModal({ isOpen, onClose, order, onStatusUpdate }: OrderDetailModalProps) {
  if (!order) return null

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
            <X className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                {getStatusBadge(order.status)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Order Time */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">Order Time:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            {order.confirmedAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">Confirmed:</span>
                <span>{formatDate(order.confirmedAt)}</span>
              </div>
            )}
            {order.dispatchedAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <Truck className="h-4 w-4" />
                <span className="font-semibold">Dispatched:</span>
                <span>{formatDate(order.dispatchedAt)}</span>
              </div>
            )}
            {order.deliveredAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <Package className="h-4 w-4" />
                <span className="font-semibold">Delivered:</span>
                <span>{formatDate(order.deliveredAt)}</span>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 font-medium">{order.customerName}</p>
              <p className="text-gray-600 text-sm">{order.customerEmail}</p>
            </div>
          </div>

          {/* Order Type and Shipping Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Shipping Information
            </h3>
            <div className="space-y-4">
              {/* Order Type Badge */}
              <div className="flex items-center gap-2">
                {order.orderType === "gift" ? (
                  <>
                    <Gift className="h-5 w-5 text-primary" />
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-base px-3 py-1">
                      🎁 Gift Order
                    </Badge>
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5 text-gray-600" />
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-base px-3 py-1">
                      📦 Self Order
                    </Badge>
                  </>
                )}
              </div>

              {/* Shipping Details Based on Order Type */}
              {order.orderType === "gift" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sender Details */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Sender (Orderer)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium">Name:</p>
                        <p className="text-gray-900">{order.senderName || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Email:</p>
                        <p className="text-gray-900">{order.senderEmail || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Phone:</p>
                        <p className="text-gray-900">{order.senderPhone || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Address:</p>
                        <p className="text-gray-900 whitespace-pre-line">{order.senderAddress || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Receiver Details (Ship To) */}
                  <div className={`p-4 rounded-lg border ${
                    order.receiverAddress 
                      ? "bg-green-50 border-green-200" 
                      : "bg-yellow-50 border-yellow-200"
                  }`}>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Receiver (Ship To)
                    </h4>
                    {order.receiverAddress ? (
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium">Name:</p>
                          <p className="text-gray-900">{order.receiverName || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Email:</p>
                          <p className="text-gray-900">{order.receiverEmail || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Phone:</p>
                          <p className="text-gray-900">{order.receiverPhone || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Address:</p>
                          <p className="text-gray-900 whitespace-pre-line">{order.receiverAddress}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-300">
                          <p className="text-green-700 font-semibold text-xs">✓ Ready to Ship</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-yellow-700 italic">
                          ⏳ Waiting for receiver to provide shipping details
                        </p>
                        <div className="text-xs text-yellow-600 mt-2">
                          <p>Receiver will fill via gift link:</p>
                          <p className="font-medium">{order.receiverEmail || "Email pending"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Ship To (Customer)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium">Name:</p>
                      <p className="text-gray-900">{order.senderName || order.customerName || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Email:</p>
                      <p className="text-gray-900">{order.senderEmail || order.customerEmail || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Phone:</p>
                      <p className="text-gray-900">{order.senderPhone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Shipping Address:</p>
                      <p className="text-gray-900 whitespace-pre-line">
                        {order.shippingAddress || order.senderAddress || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.type === "product" ? "Product" : "Service"}
                        {item.isService ? ` • ${item.hours ?? item.quantity} hour(s)` : ` • Qty: ${item.quantity}`}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">{item.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-primary">${order.total.toFixed(2)}</span>
          </div>

          {/* Status dropdown + Action Buttons */}
          {onStatusUpdate && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <label htmlFor="order-status" className="text-sm font-medium text-gray-700">Update status:</label>
                <select
                  id="order-status"
                  value={order.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Order["status"]
                    if (order.orderType === "gift" && !order.receiverAddress && (newStatus === "confirmed" || newStatus === "dispatched")) {
                      alert("Cannot confirm or dispatch: Receiver address is required for gift orders.")
                      return
                    }
                    onStatusUpdate(order.id, newStatus)
                    onClose()
                  }}
                  className="rounded border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {/* Confirm Order Button */}
              {order.status === "pending" && (
                <>
                  <Button
                    onClick={() => {
                      if (order.orderType === "gift" && !order.receiverAddress) {
                        alert("Cannot confirm order: Receiver address is required for gift orders.")
                        return
                      }
                      onStatusUpdate(order.id, "confirmed")
                      onClose()
                    }}
                    disabled={order.orderType === "gift" && !order.receiverAddress}
                    className="w-full bg-primary hover:bg-primary/90 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {order.orderType === "gift" && !order.receiverAddress 
                      ? "Waiting for Receiver Address"
                      : "Confirm Order"}
                  </Button>
                  {order.orderType === "gift" && !order.receiverAddress && (
                    <p className="text-xs text-yellow-600 text-center">
                      ⏳ Cannot confirm until receiver provides shipping address via gift link
                    </p>
                  )}
                </>
              )}
              
              {/* Dispatch Button */}
              {order.status === "confirmed" && (
                <>
                  <Button
                    onClick={() => {
                      onStatusUpdate(order.id, "dispatched")
                      onClose()
                    }}
                    disabled={order.orderType === "gift" && !order.receiverAddress}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {order.orderType === "gift" && !order.receiverAddress
                      ? "Cannot Dispatch - No Address"
                      : "Mark as Dispatched"}
                  </Button>
                  {order.orderType === "gift" && !order.receiverAddress && (
                    <p className="text-xs text-yellow-600 text-center">
                      ⏳ Cannot dispatch until receiver provides shipping address
                    </p>
                  )}
                  {order.orderType === "self" && (
                    <p className="text-xs text-green-600 text-center">
                      ✓ Shipping address confirmed - Ready to dispatch
                    </p>
                  )}
                  {order.orderType === "gift" && order.receiverAddress && (
                    <p className="text-xs text-green-600 text-center">
                      ✓ Receiver address confirmed - Ready to dispatch
                    </p>
                  )}
                </>
              )}
              
              {/* Delivered Button */}
              {order.status === "dispatched" && (
                <Button
                  onClick={() => {
                    onStatusUpdate(order.id, "delivered")
                    onClose()
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Mark as Delivered
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

