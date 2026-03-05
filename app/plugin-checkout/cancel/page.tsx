"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"

export default function PluginCheckoutCancelPage() {
  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <XCircle className="h-6 w-6" />
            Checkout cancelled
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            You left the Stripe payment page. No charge was made.
          </p>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/plugin-checkout">Try again</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
