"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Copy, Gift, Mail, Package, Loader2, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { getOrderById } from "@/lib/api/orders"

function OrderSuccessContent() {
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
  const [orderReceiver, setOrderReceiver] = useState<{ name?: string; email?: string; phone?: string } | null>(null)
  const [sentByEmail, setSentByEmail] = useState(false)
  const [sentBySms, setSentBySms] = useState(false)

  useEffect(() => {
    if (token && type === "gift") {
      const link = `${window.location.origin}/gift-receiver/${token}`
      setGiftLink(link)
    }
    const deliveryInfo = localStorage.getItem("giftLinkDelivery")
    if (deliveryInfo) {
      try {
        const parsed = JSON.parse(deliveryInfo)
        setGiftLinkDelivery(parsed)
        if (parsed.giftLink) setGiftLink(parsed.giftLink)
      } catch (e) {
        console.error("Error parsing gift link delivery info:", e)
      }
    }
  }, [token, type])

  useEffect(() => {
    if (type !== "gift" || !orderId || giftLink) return
    let cancelled = false
    getOrderById(orderId)
      .then((order: any) => {
        if (cancelled) return
        if (order?.gift_link) setGiftLink(order.gift_link)
        else if (order?.gift_token)
          setGiftLink(`${typeof window !== "undefined" ? window.location.origin : ""}/gift-receiver/${order.gift_token}`)
        if (order?.receiver_name || order?.receiver_email || order?.receiver_phone)
          setOrderReceiver({
            name: order.receiver_name,
            email: order.receiver_email,
            phone: order.receiver_phone,
          })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [type, orderId, giftLink])

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

  const receiverName = giftLinkDelivery?.receiverName ?? orderReceiver?.name ?? "Recipient"
  const receiverEmail = giftLinkDelivery?.receiverEmail ?? orderReceiver?.email
  const receiverPhone = giftLinkDelivery?.receiverPhone ?? orderReceiver?.phone
  const senderName = giftLinkDelivery?.senderName ?? "Sender"

  const sendGiftLink = async () => {
    if (!giftLinkDelivery || sendingGiftLink) return
    setSendingGiftLink(true)
    try {
      const response = await fetch('/api/send-gift-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          setSentByEmail(true)
          showToast("Gift link sent via email successfully!", "success")
        } else if (giftLinkDelivery.method === 'sms') {
          setSentBySms(true)
          showToast("Gift link sent via SMS successfully!", "success")
        }
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

  const sendGiftLinkWithMethod = async (method: "email" | "sms") => {
    if (!giftLink || sendingGiftLink) return
    if (method === "email" && !receiverEmail) {
      showToast("Recipient email not found. Use Copy Link to share manually.", "error")
      return
    }
    if (method === "sms" && !receiverPhone) {
      showToast("Recipient phone not found. Use Copy Link to share manually.", "error")
      return
    }
    setSendingGiftLink(true)
    try {
      const response = await fetch('/api/send-gift-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          receiverName,
          receiverEmail: method === "email" ? receiverEmail : undefined,
          receiverPhone: method === "sms" ? receiverPhone : undefined,
          senderName,
          giftLink,
        }),
      })
      const data = await response.json()
      if (data.success) {
        if (method === "email") setSentByEmail(true)
        else setSentBySms(true)
        showToast(method === "email" ? "Gift link sent via email!" : "Gift link sent via SMS!", "success")
      } else {
        showToast(data.error || "Failed to send", "error")
      }
    } catch (error: any) {
      showToast("Failed to send. Use Copy Link to share.", "error")
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
              {paymentVerified && (
                <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-500 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700">Payment Confirmed</span>
                </div>
              )}

              {/* Auto-send status when user had chosen email/SMS before payment */}
              {giftLinkDelivery && (giftLinkDelivery.method === 'email' || giftLinkDelivery.method === 'sms') && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-blue-800">
                    {sendingGiftLink ? (
                      <><Loader2 className="inline h-4 w-4 mr-2 animate-spin" /> Sending...</>
                    ) : giftLinkDelivery.method === 'email' ? (
                      <>📧 Gift link sent to <strong>{giftLinkDelivery.receiverEmail}</strong></>
                    ) : (
                      <>📱 Gift link sent via SMS to <strong>{giftLinkDelivery.receiverPhone}</strong></>
                    )}
                  </p>
                </div>
              )}

              <div className="border-2 rounded-lg p-4 mb-6 bg-gray-50 border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <Gift className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Share the gift link with the recipient</h3>
                    <p className="text-sm text-gray-700">
                      The recipient will open the link and enter their address and contact details so we can ship the gift.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1 border-2 bg-white hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => sendGiftLinkWithMethod("email")}
                    disabled={sendingGiftLink || sentByEmail || !receiverEmail}
                  >
                    <Mail className="h-5 w-5" />
                    <span>{sentByEmail ? "Sent by email" : "Send by email"}</span>
                    {receiverEmail && !sentByEmail && (
                      <span className="text-xs text-gray-500 font-normal truncate max-w-full">{receiverEmail}</span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1 border-2 bg-white hover:bg-green-50 hover:border-green-300"
                    onClick={() => sendGiftLinkWithMethod("sms")}
                    disabled={sendingGiftLink || sentBySms || !receiverPhone}
                  >
                    <Smartphone className="h-5 w-5" />
                    <span>{sentBySms ? "Sent by SMS" : "Send by SMS"}</span>
                    {receiverPhone && !sentBySms && (
                      <span className="text-xs text-gray-500 font-normal truncate max-w-full">{receiverPhone}</span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1 border-2 bg-white hover:bg-purple-50 hover:border-purple-300"
                    onClick={handleCopyLink}
                    disabled={!giftLink}
                  >
                    <Copy className="h-5 w-5" />
                    <span>{copied ? "Copied!" : "Copy link"}</span>
                  </Button>
                </div>

                <div className="bg-white p-3 rounded border border-gray-300">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Gift receiver link:</p>
                  <p className="text-xs text-gray-600 break-all font-mono bg-gray-50 p-2 rounded mb-2">{giftLink}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? "Copied!" : "Copy link"}
                  </Button>
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

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-2 border-gray-200 bg-white shadow-lg">
          <div className="p-8 text-center">
            <Loader2 className="h-20 w-20 text-primary mx-auto mb-6 animate-spin" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Loading...</h1>
            <p className="text-gray-600">Please wait while we load your order details.</p>
          </div>
        </Card>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
