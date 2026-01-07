"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Gift, MapPin, Phone, User, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { getOrderByGiftToken, confirmGiftReceiver } from "@/lib/api/orders"

export default function GiftReceiverPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [order, setOrder] = useState<any>(null)
  const [receiverAddress, setReceiverAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
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
      alert("Please enter your address")
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
      setSubmitted(true)
    } catch (error: any) {
      console.error("Error submitting receiver address:", error)
      alert(`Failed to submit address: ${error.message || "Please try again."}`)
    } finally {
      setLoading(false)
    }
  }

  if (error || (!order && !loading)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Gift not found</h2>
          <p className="text-gray-600 mb-4">
            {error || "This gift link is invalid or has expired."}
          </p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gift details...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-primary">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">
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

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Gift className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You Received a Gift!</h1>
          <p className="text-gray-600">
            {order.sender_name} has sent you a gift. Please confirm your delivery address.
          </p>
        </div>

        <Card className="border-2 border-gray-200 mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Gift Details</h2>
            <div className="space-y-3 mb-6">
              {order.order_items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
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

        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Your Information
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
                  className="bg-gray-50 text-gray-600"
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
                  className="bg-gray-50 text-gray-600"
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
                    className="bg-gray-50 text-gray-600"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your complete delivery address"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !receiverAddress.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Confirm Address"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

