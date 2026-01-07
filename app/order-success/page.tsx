"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Copy, Gift, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const orderId = searchParams.get("orderId")
  const type = searchParams.get("type") || "self"
  const [giftLink, setGiftLink] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (token && type === "gift") {
      const link = `${window.location.origin}/gift-receiver/${token}`
      setGiftLink(link)
    }
  }, [token, type])

  const handleCopyLink = () => {
    if (giftLink) {
      navigator.clipboard.writeText(giftLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-2 border-primary">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {type === "gift" ? "Gift Order Placed!" : "Order Placed Successfully!"}
          </h1>
          <p className="text-gray-600 mb-6">
            {type === "gift"
              ? "Your gift order has been placed. Share the link below with the receiver to confirm their delivery address."
              : "Your order has been confirmed and will be processed shortly."}
          </p>

          {type === "gift" && giftLink && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-900">Gift Receiver Link:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-gray-600 break-all text-left">{giftLink}</p>
            </div>
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

