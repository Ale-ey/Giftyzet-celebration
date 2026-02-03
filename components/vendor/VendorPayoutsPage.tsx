"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/api/auth"
import { supabase } from "@/lib/supabase/client"

interface PendingRow {
  id: string
  vendor_order_id: string
  order_id: string
  order_number: string
  order_total: number
  commission_amount: number
  vendor_amount: number
  delivered_at: string
}

interface ReceivedRow {
  id: string
  vendor_order_id: string
  order_id: string
  order_number: string
  order_total: number
  commission_amount: number
  vendor_amount: number
  paid_at: string
}

export type PayoutStatusFilter = "all" | "pending" | "received"

/** Single table row: pending or received */
interface PayoutRow {
  id: string
  order_number: string
  date: string
  status: "pending" | "received"
  order_total: number
  commission_amount: number
  vendor_amount: number
}

export default function VendorPayoutsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusParam = (searchParams.get("status") || "all") as PayoutStatusFilter
  const validStatus = ["all", "pending", "received"].includes(statusParam) ? statusParam : "all"

  const [pending, setPending] = useState<PendingRow[]>([])
  const [received, setReceived] = useState<ReceivedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setStatusFilter = (status: PayoutStatusFilter) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === "all") params.delete("status")
    else params.set("status", status)
    router.push(`/vendor/payouts?${params.toString()}`)
  }

  const allRows = useMemo((): PayoutRow[] => {
    const pendingRows: PayoutRow[] = pending.map((r) => ({
      id: r.id,
      order_number: r.order_number,
      date: r.delivered_at,
      status: "pending" as const,
      order_total: r.order_total,
      commission_amount: r.commission_amount,
      vendor_amount: r.vendor_amount,
    }))
    const receivedRows: PayoutRow[] = received.map((r) => ({
      id: r.id,
      order_number: r.order_number,
      date: r.paid_at,
      status: "received" as const,
      order_total: r.order_total,
      commission_amount: r.commission_amount,
      vendor_amount: r.vendor_amount,
    }))
    return [...receivedRows, ...pendingRows].sort((a, b) => {
      const da = new Date(a.date).getTime()
      const db = new Date(b.date).getTime()
      return db - da
    })
  }, [pending, received])

  const filteredRows = useMemo(() => {
    if (validStatus === "pending") return allRows.filter((r) => r.status === "pending")
    if (validStatus === "received") return allRows.filter((r) => r.status === "received")
    return allRows
  }, [allRows, validStatus])

  useEffect(() => {
    loadPayouts()
  }, [])

  async function loadPayouts() {
    try {
      setLoading(true)
      setError(null)
      const user = await getCurrentUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        router.push("/auth/login")
        return
      }

      const res = await fetch("/api/vendor/payouts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Failed to load payouts")
        return
      }
      const data = await res.json()
      setPending(data.pending || [])
      setReceived(data.received || [])
    } catch (e) {
      console.error("Load payouts error:", e)
      setError("Failed to load payouts")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading payouts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/vendor")}
          className="mb-6 text-gray-700 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payouts</h1>
          <p className="text-gray-600">View pending and received payouts for your store</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-700">{error}</CardContent>
          </Card>
        )}

        <Card className="border border-gray-200 bg-white">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-gray-900">All Payouts</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                  {(["all", "pending", "received"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        validStatus === status
                          ? "bg-white text-gray-900 shadow border border-gray-200"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {status === "all" ? "All" : status === "pending" ? "Pending" : "Received"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <CardDescription>
              Filter by status using the tabs above. Pending = awaiting platform payout; Received = already paid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRows.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">
                {validStatus === "all" ? "No payouts yet" : `No ${validStatus} payouts`}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="pb-3 pr-4 font-medium">Order #</th>
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium text-right">Order total</th>
                      <th className="pb-3 pr-4 font-medium text-right">Commission</th>
                      <th className="pb-3 pr-4 font-medium text-right">Your amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100">
                        <td className="py-3 pr-4 font-medium text-gray-900">{row.order_number}</td>
                        <td className="py-3 pr-4 text-gray-600">
                          {row.date ? new Date(row.date).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant="outline"
                            className={
                              row.status === "received"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }
                          >
                            {row.status === "received" ? "Received" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-900">
                          ${row.order_total.toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-600">
                          -${row.commission_amount.toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold text-primary">
                          ${row.vendor_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {filteredRows.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                <span className="text-sm text-gray-600">
                  Total ({validStatus}):{" "}
                  <span className="font-semibold text-primary">
                    ${filteredRows.reduce((s, r) => s + r.vendor_amount, 0).toFixed(2)}
                  </span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
