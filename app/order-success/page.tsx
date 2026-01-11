"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Copy, Gift, Package, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const token = searchParams.get("token")
  const orderId = searchParams.get("orderId")
  const sessionId = searchParams.get("session_id")
  const type = searchParams.get("type") || "self"
  const [giftLink, setGiftLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [giftLinkDelivery, setGiftLinkDelivery] = useState<any>(null)
  const [sendingGiftLink, setSendingGiftLink] = useState(false)

  useEffect(() => {
    if (token && type === "gift") {
      const link = `${window.location.origin}/gift-receiver/${token}`
      setGiftLink(link)
    }
    
    // Load gift link delivery info from localStorage
    const deliveryInfo = localStorage.getItem("giftLinkDelivery")
    if (deliveryInfo) {
      try {
        const parsed = JSON.parse(deliveryInfo)
        setGiftLinkDelivery(parsed)
        if (parsed.giftLink) {
          setGiftLink(parsed.giftLink)
        }
      } catch (e) {
        console.error("Error parsing gift link delivery info:", e)
      }
    }
  }, [token, type])

  useEffect(() => {
    async function verifyPayment() {
      if (sessionId && !paymentVerified) {
        setVerifying(true)
        try {
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          })

          const data = await response.json()

          if (data.success && data.paymentStatus === 'paid') {
            setPaymentVerified(true)
            showToast("Payment successful! Your order has been confirmed.", "success")
            
            // Dispatch event to update orders
            window.dispatchEvent(new Event("ordersUpdated"))
            
            // Send gift link if method is email or SMS
            if (giftLinkDelivery && (giftLinkDelivery.method === 'email' || giftLinkDelivery.method === 'sms')) {
              sendGiftLink()
            }
          } else {
            showToast("Payment verification pending. Please check back later.", "warning")
          }
        } catch (error) {
          console.error('Error verifying payment:', error)
          showToast("Failed to verify payment status", "error")
        } finally {
          setVerifying(false)
        }
      }
    }

    verifyPayment()
  }, [sessionId, paymentVerified, showToast, giftLinkDelivery])

  const handleCopyLink = () => {
    if (giftLink) {
      navigator.clipboard.writeText(giftLink)
      setCopied(true)
      showToast("Gift link copied to clipboard!", "success")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sendGiftLink = async () => {
    if (!giftLinkDelivery || sendingGiftLink) return
    
    setSendingGiftLink(true)
    try {
      const response = await fetch('/api/send-gift-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: giftLinkDelivery.method,
          receiverName: giftLinkDelivery.receiverName,
          receiverEmail: giftLinkDelivery.receiverEmail,
          receiverPhone: giftLinkDelivery.receiverPhone,
          senderName: giftLinkDelivery.senderName,
          giftLink: giftLinkDelivery.giftLink,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (giftLinkDelivery.method === 'email') {
          showToast("Gift link sent via email successfully!", "success")
        } else if (giftLinkDelivery.method === 'sms') {
          showToast("Gift link sent via SMS successfully!", "success")
        }
        
        // Clear the delivery info from localStorage after successful send
        localStorage.removeItem("giftLinkDelivery")
      } else {
        showToast(`Failed to send gift link: ${data.error}`, "error")
      }
    } catch (error: any) {
      console.error('Error sending gift link:', error)
      showToast("Failed to send gift link. You can copy it below.", "error")
    } finally {
      setSendingGiftLink(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-2 border-gray-200 bg-white shadow-lg">
        <CardContent className="p-8 text-center bg-white">
          {verifying ? (
            <>
              <Loader2 className="h-20 w-20 text-primary mx-auto mb-6 animate-spin" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Verifying Payment...
              </h1>
              <p className="text-gray-600 mb-6">
                Please wait while we confirm your payment.
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {type === "gift" ? "Gift Order Placed!" : "Order Placed Successfully!"}
              </h1>
              
              {/* Payment Confirmed Badge - especially for self orders */}
              {paymentVerified && type === "self" && (
                <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-500 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700">Payment Confirmed</span>
                </div>
              )}
              
              <p className="text-gray-600 mb-6">
                {type === "gift"
                  ? "Your gift order has been placed and payment confirmed. Share the link below with the receiver to confirm their delivery address."
                  : paymentVerified 
                    ? "Your payment has been confirmed! Your order will be processed and dispatched shortly."
                    : "Your order has been confirmed and payment received. Your order will be processed shortly."}
              </p>
              
              {/* Additional info for self orders */}
              {type === "self" && paymentVerified && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-primary" />
                    What's Next?
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>✓ Payment confirmed - Order is being processed</li>
                    <li>✓ Your shipping address is confirmed</li>
                    <li>• Vendor will dispatch your order soon</li>
                    <li>• You'll receive tracking updates via email</li>
                  </ul>
                </div>
              )}
            </>
          )}

          {type === "gift" && giftLink && (
            <>
              {/* Payment Confirmed for Gift Orders */}
              {paymentVerified && (
                <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-500 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700">Payment Confirmed</span>
                </div>
              )}
              
              {/* Delivery Method Status */}
              {giftLinkDelivery && (
                <div className="mb-4">
                  {giftLinkDelivery.method === 'email' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-blue-800">
                        {sendingGiftLink ? (
                          <>
                            <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                            Sending gift link via email...
                          </>
                        ) : (
                          <>
                            📧 Gift link has been sent to <strong>{giftLinkDelivery.receiverEmail}</strong>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {giftLinkDelivery.method === 'sms' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-blue-800">
                        {sendingGiftLink ? (
                          <>
                            <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                            Sending gift link via SMS...
                          </>
                        ) : (
                          <>
                            📱 Gift link has been sent via SMS to <strong>{giftLinkDelivery.receiverPhone}</strong>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {giftLinkDelivery.method === 'copy' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-purple-800">
                        🔗 Your gift link is ready! Copy it below and share it with <strong>{giftLinkDelivery.receiverName}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Gift Link Section */}
              <div className={`border-2 rounded-lg p-4 mb-6 ${
                giftLinkDelivery?.method === 'copy' 
                  ? 'bg-purple-50 border-purple-400' 
                  : 'bg-yellow-50 border-yellow-400'
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  <Gift className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                    giftLinkDelivery?.method === 'copy' ? 'text-purple-700' : 'text-yellow-700'
                  }`} />
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {giftLinkDelivery?.method === 'copy' ? 'Copy & Share Gift Link' : 'Gift Link (Backup)'}
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      {giftLinkDelivery?.method === 'copy' 
                        ? 'Share this link with the receiver so they can confirm their shipping address.'
                        : 'Your order cannot be dispatched until the receiver confirms their shipping address. You can also share this link as a backup.'}
                    </p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-300">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-900">Gift Receiver Link:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? "Copied!" : "Copy Link"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 break-all text-left font-mono bg-gray-50 p-2 rounded">
                    {giftLink}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/marketplace")}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Continue Shopping
            </Button>
            {orderId && (
              <Button
                variant="outline"
                onClick={() => router.push(`/orders/${orderId}`)}
                className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                View Order
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

