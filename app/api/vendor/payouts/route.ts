import { NextRequest, NextResponse } from "next/server"
import { getServerUserAndRole } from "@/lib/supabase/server"
import { createServerSupabase } from "@/lib/supabase/server"

export interface PendingPayoutRow {
  id: string
  vendor_order_id: string
  order_id: string
  order_number: string
  order_total: number
  commission_amount: number
  vendor_amount: number
  delivered_at: string
}

export interface ReceivedPayoutRow {
  id: string
  vendor_order_id: string
  order_id: string
  order_number: string
  order_total: number
  commission_amount: number
  vendor_amount: number
  paid_at: string
}

/**
 * GET /api/vendor/payouts
 * Returns pending (delivered, not yet paid) and received payouts for the authenticated vendor.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || (auth.role !== "vendor" && auth.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabase(token)

    const { data: vendorRow } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", auth.user.id)
      .single()

    if (!vendorRow?.id) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 403 })
    }
    const vendorId = vendorRow.id

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("commission_percent")
      .eq("id", "default")
      .single()
    const commissionPercent = Number(settings?.commission_percent ?? 10)

    // Pending: vendor_orders delivered, payout_status pending
    const { data: pendingOrders, error: voError } = await supabase
      .from("vendor_orders")
      .select("id, order_id, store_id, delivered_at, commission_amount, vendor_amount")
      .eq("vendor_id", vendorId)
      .eq("status", "delivered")
      .eq("payout_status", "pending")
      .not("delivered_at", "is", null)
      .order("delivered_at", { ascending: true })

    if (voError) {
      return NextResponse.json({ error: "Failed to load pending payouts" }, { status: 500 })
    }

    const pending: PendingPayoutRow[] = []

    if (pendingOrders?.length) {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number")
        .in("id", pendingOrders.map((vo) => vo.order_id))
      const orderMap = new Map((orders || []).map((o) => [o.id, o]))

      const orderIds = [...new Set(pendingOrders.map((vo) => vo.order_id))]
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id, product_id, service_id, price, quantity")
        .in("order_id", orderIds)

      const { data: products } = await supabase
        .from("products")
        .select("id, store_id")
        .in("store_id", pendingOrders.map((vo) => vo.store_id))
      const { data: services } = await supabase
        .from("services")
        .select("id, store_id")
        .in("store_id", pendingOrders.map((vo) => vo.store_id))
      const productStoreMap = new Map((products || []).map((p) => [p.id, p.store_id]))
      const serviceStoreMap = new Map((services || []).map((s) => [s.id, s.store_id]))

      for (const vo of pendingOrders) {
        let orderTotal = 0
        for (const item of orderItems || []) {
          if (item.order_id !== vo.order_id) continue
          const price = Number(item.price)
          const qty = item.quantity || 1
          if (item.product_id) {
            if (productStoreMap.get(item.product_id) === vo.store_id) orderTotal += price * qty
          } else if (item.service_id) {
            if (serviceStoreMap.get(item.service_id) === vo.store_id) orderTotal += price * qty
          }
        }
        const commissionAmount =
          vo.commission_amount != null
            ? Number(vo.commission_amount)
            : Math.round((orderTotal * commissionPercent) / 100 * 100) / 100
        const vendorAmount =
          vo.vendor_amount != null
            ? Number(vo.vendor_amount)
            : Math.round((orderTotal - commissionAmount) * 100) / 100
        const order = orderMap.get(vo.order_id)
        pending.push({
          id: vo.id,
          vendor_order_id: vo.id,
          order_id: vo.order_id,
          order_number: order?.order_number || String(vo.order_id).slice(0, 8),
          order_total: Math.round(orderTotal * 100) / 100,
          commission_amount: commissionAmount,
          vendor_amount: vendorAmount,
          delivered_at: vo.delivered_at || "",
        })
      }
    }

    // Received: vendor_payouts for this vendor
    const { data: payoutRows, error: payError } = await supabase
      .from("vendor_payouts")
      .select("id, vendor_order_id, order_id, order_total, commission_amount, vendor_amount, paid_at")
      .eq("vendor_id", vendorId)
      .order("paid_at", { ascending: false })

    if (payError) {
      return NextResponse.json({ error: "Failed to load received payouts" }, { status: 500 })
    }

    const received: ReceivedPayoutRow[] = []
    if (payoutRows?.length) {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number")
        .in("id", payoutRows.map((p) => p.order_id))
      const orderMap = new Map((orders || []).map((o) => [o.id, o]))
      for (const p of payoutRows) {
        const order = orderMap.get(p.order_id)
        received.push({
          id: p.id,
          vendor_order_id: p.vendor_order_id,
          order_id: p.order_id,
          order_number: order?.order_number || String(p.order_id).slice(0, 8),
          order_total: Number(p.order_total),
          commission_amount: Number(p.commission_amount),
          vendor_amount: Number(p.vendor_amount),
          paid_at: p.paid_at || "",
        })
      }
    }

    return NextResponse.json({ pending, received })
  } catch (e) {
    console.error("Vendor payouts GET error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
