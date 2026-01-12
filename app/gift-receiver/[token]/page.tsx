"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Gift, MapPin, Phone, User, CheckCircle, XCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { getOrderByGiftToken, confirmGiftReceiver } from "@/lib/api/orders"

export default function GiftReceiverPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const { showToast } = useToast()

  const [order, setOrder] = useState<any>(null)
  const [receiverAddress, setReceiverAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rejected, setRejected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load order data from Supabase using gift token
    const loadOrder = async () => {
      try {
        const orderData = await getOrderByGiftToken(token)
        setOrder(orderData)
        setReceiverAddress(orderData.receiver_address || "")
      } catch (e: any) {
        console.error("Error loading gift order:", e)
        setError(e.message || "Gift not found")
      }
    }
    
    if (token) {
      loadOrder()
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!receiverAddress.trim()) {
      showToast("Please enter your address", "error")
      return
    }

    setLoading(true)

    try {
      // Confirm gift receiver address via Supabase API
      await confirmGiftReceiver(token, receiverAddress.trim())
      
      // Update local state
      setOrder((prev: any) => ({
        ...prev,
        receiver_address: receiverAddress.trim(),
        status: 'confirmed'
      }))
      
      window.dispatchEvent(new Event("ordersUpdated"))
      showToast("Address confirmed successfully!", "success")
      setSubmitted(true)
    } catch (error: any) {
      console.error("Error submitting receiver address:", error)
      showToast(error.message || "Failed to submit address. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this gift? This action cannot be undone.")) {
      return
    }

    setLoading(true)

    try {
      // TODO: Implement reject gift API call
      // For now, just update local state
      showToast("Gift rejected. The sender will be notified.", "info")
      setRejected(true)
      
      window.dispatchEvent(new Event("ordersUpdated"))
    } catch (error: any) {
      console.error("Error rejecting gift:", error)
      showToast(error.message || "Failed to reject gift. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  if (error || (!order && !loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Gift Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "This gift link is invalid or has expired."}
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
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gift details...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white border-2 border-green-500 shadow-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your address has been confirmed. Your gift will be delivered soon!
            </p>
            <Button
              onClick={() => router.push("/marketplace")}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (rejected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white border-2 border-red-500 shadow-lg">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gift Rejected</h2>
            <p className="text-gray-600 mb-6">
              You have declined this gift. The sender has been notified.
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Gift className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You Received a Gift! 🎁</h1>
          <p className="text-gray-600">
            {order.sender_name} has sent you a gift. Please confirm your delivery address or decline the gift.
          </p>
        </div>

        {/* Sender Information Card */}
        <Card className="bg-white border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Sender Information
            </h2>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{order.sender_name}</p>
                </div>
              </div>
              {order.sender_email && (
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{order.sender_email}</p>
                  </div>
                </div>
              )}
              {order.sender_phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{order.sender_phone}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Gift className="h-5 w-5 mr-2 text-primary" />
              Gift Details
            </h2>
            <div className="space-y-3 mb-6">
              {order.order_items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                  </div>
                  <p className="font-semibold text-gray-900">${parseFloat(item.price).toFixed(2)}</p>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span>${parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              Confirm Your Delivery Address
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="receiverName" className="text-sm font-semibold text-gray-900">
                  Full Name
                </label>
                <Input
                  id="receiverName"
                  value={order.receiver_name || ""}
                  disabled
                  className="bg-gray-50 text-gray-600 border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="receiverEmail" className="text-sm font-semibold text-gray-900">
                  Email
                </label>
                <Input
                  id="receiverEmail"
                  type="email"
                  value={order.receiver_email || ""}
                  disabled
                  className="bg-gray-50 text-gray-600 border-gray-200"
                />
              </div>
              {order.receiver_phone && (
                <div className="space-y-2">
                  <label htmlFor="receiverPhone" className="text-sm font-semibold text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Phone Number
                  </label>
                  <Input
                    id="receiverPhone"
                    type="tel"
                    value={order.receiver_phone}
                    disabled
                    className="bg-gray-50 text-gray-600 border-gray-200"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="receiverAddress" className="text-sm font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Delivery Address *
                </label>
                <textarea
                  id="receiverAddress"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your complete delivery address&#10;Street, City, State, ZIP Code"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Privacy Protected:</strong> Your address is kept private and will only be used for delivery.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading || !receiverAddress.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm & Accept Gift
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleReject}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-2 border-red-500 text-red-600 hover:bg-red-50 bg-white"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Gift
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

