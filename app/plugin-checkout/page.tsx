"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { Loader2, ExternalLink } from "lucide-react"

const DEFAULT_PAYLOAD = {
  sender_name: "Test Sender",
  sender_email: "sender@example.com",
  sender_phone: "+15550100",
  sender_address: "123 Test St, City",
  receiver_email: "receiver@example.com",
  items: [{ name: "Test Gift", price: 29.99, quantity: 1 }],
}

export default function PluginCheckoutPage() {
  const { showToast } = useToast()
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)

  const startRedirectCheckout = async () => {
    const key = apiKey.trim()
    if (!key) {
      showToast("Enter your plugin API key", "error")
      return
    }
    setLoading(true)
    try {
      const base = typeof window !== "undefined" ? window.location.origin : ""
      const res = await fetch("/api/plugin/v1/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": key,
        },
        body: JSON.stringify({
          ...DEFAULT_PAYLOAD,
          redirect_checkout: true,
          // Redirect to the main order status page so the user always sees a valid status screen
          success_url: `${base}/order-success?session_id={CHECKOUT_SESSION_ID}&type=self`,
          cancel_url: `${base}/order-success?session_id={CHECKOUT_SESSION_ID}&type=self`,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(data.error || "Failed to create checkout", "error")
        setLoading(false)
        return
      }
      if (data.url) {
        showToast("Redirecting to Stripe…", "success")
        window.location.href = data.url
        return
      }
      showToast("No redirect URL returned", "error")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Request failed", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Plugin checkout (redirect to Stripe)
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            You will be sent to Stripe’s hosted payment page to enter card details and complete payment. The amount is shown on Stripe. After payment, the order is created automatically by webhook.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              Plugin API key
            </label>
            <Input
              id="api-key"
              type="password"
              placeholder="Your plugin API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button
            onClick={startRedirectCheckout}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating checkout…
              </>
            ) : (
              "Redirect to Stripe payment form"
            )}
          </Button>
          <p className="text-muted-foreground text-xs">
            Uses test data: $29.99 item, sender/receiver from defaults. On Stripe use test card 4242 4242 4242 4242.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
