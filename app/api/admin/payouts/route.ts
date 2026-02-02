import { NextRequest, NextResponse } from "next/server"
import { getServerUserAndRole } from "@/lib/supabase/server"
import { createServerSupabase } from "@/lib/supabase/server"

export interface PayoutRowApi {
  id: string
  vendor_order_id: string
  order_id: string
  order_number: string
  store_name: string
  vendor_name: string
  order_total: number
  commission_amount: number
  vendor_amount: number
  delivered_at: string
  status: "pending" | "paid" | "failed"
  paid_at?: string
}

/**
 * GET /api/admin/payouts
 * Query params: page, per_page (default 10), search, store_name, vendor_name, status (all|pending|paid)
 * Returns paginated list of delivered vendor orders (pending and paid) with status.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabase(token)
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get("per_page") || "10", 10)))
    const searchQuery = (searchParams.get("search") || "").trim().toLowerCase()
    const storeNameParam = (searchParams.get("store_name") || "").trim().toLowerCase()
    const vendorNameParam = (searchParams.get("vendor_name") || "").trim().toLowerCase()
    const statusParam = (searchParams.get("status") || "all").toLowerCase()
    const statusFilter = ["all", "pending", "paid", "failed"].includes(statusParam)
      ? statusParam
      : "all"

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("commission_percent")
      .eq("id", "default")
      .single()
    const commissionPercent = Number(settings?.commission_percent ?? 10)

    const { data: vendorOrders, error: voError } = await supabase
      .from("vendor_orders")
      .select("id, order_id, vendor_id, store_id, delivered_at, payout_status, commission_amount, vendor_amount, payout_at")
      .eq("status", "delivered")
      .not("delivered_at", "is", null)
      .order("delivered_at", { ascending: false })

    if (voError) {
      return NextResponse.json({ error: "Failed to load payouts" }, { status: 500 })
    }
    if (!vendorOrders?.length) {
      return NextResponse.json({ payouts: [], total: 0, page: 1, per_page: perPage })
    }

    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number")
      .in("id", vendorOrders.map((vo) => vo.order_id))
    const orderMap = new Map((orders || []).map((o) => [o.id, o]))

    const { data: stores } = await supabase
      .from("stores")
      .select("id, name")
      .in("id", vendorOrders.map((vo) => vo.store_id))
    const storeMap = new Map((stores || []).map((s) => [s.id, s]))

    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, vendor_name, business_name")
      .in("id", vendorOrders.map((vo) => vo.vendor_id))
    const vendorMap = new Map((vendors || []).map((v) => [v.id, v]))

    const orderIds = [...new Set(vendorOrders.map((vo) => vo.order_id))]
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("order_id, product_id, service_id, price, quantity")
      .in("order_id", orderIds)

    const { data: products } = await supabase
      .from("products")
      .select("id, store_id")
      .in("store_id", vendorOrders.map((vo) => vo.store_id))
    const { data: services } = await supabase
      .from("services")
      .select("id, store_id")
      .in("store_id", vendorOrders.map((vo) => vo.store_id))
    const productStoreMap = new Map((products || []).map((p) => [p.id, p.store_id]))
    const serviceStoreMap = new Map((services || []).map((s) => [s.id, s.store_id]))

    const payouts: PayoutRowApi[] = []

    for (const vo of vendorOrders) {
      let orderTotal = 0
      for (const item of orderItems || []) {
        if (item.order_id !== vo.order_id) continue
        const price = Number(item.price)
        const qty = item.quantity || 1
        if (item.product_id) {
          const storeId = productStoreMap.get(item.product_id)
          if (storeId === vo.store_id) orderTotal += price * qty
        } else if (item.service_id) {
          const storeId = serviceStoreMap.get(item.service_id)
          if (storeId === vo.store_id) orderTotal += price * qty
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
      const store = storeMap.get(vo.store_id)
      const vendor = vendorMap.get(vo.vendor_id)
      const storeName = store?.name || "—"
      const vendorName = vendor?.business_name || vendor?.vendor_name || "—"
      const payoutStatus = (vo.payout_status === "paid" || vo.payout_status === "failed"
        ? vo.payout_status
        : "pending") as "pending" | "paid" | "failed"

      payouts.push({
        id: vo.id,
        vendor_order_id: vo.id,
        order_id: vo.order_id,
        order_number: order?.order_number || String(vo.order_id).slice(0, 8),
        store_name: storeName,
        vendor_name: vendorName,
        order_total: Math.round(orderTotal * 100) / 100,
        commission_amount: commissionAmount,
        vendor_amount: vendorAmount,
        delivered_at: vo.delivered_at || "",
        status: payoutStatus,
        paid_at: vo.payout_at || undefined,
      })
    }

    let filtered = payouts

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.store_name.toLowerCase().includes(searchQuery) ||
          p.vendor_name.toLowerCase().includes(searchQuery)
      )
    }
    if (storeNameParam) {
      filtered = filtered.filter((p) => p.store_name.toLowerCase().includes(storeNameParam))
    }
    if (vendorNameParam) {
      filtered = filtered.filter((p) => p.vendor_name.toLowerCase().includes(vendorNameParam))
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    const total = filtered.length
    const start = (page - 1) * perPage
    const paginated = filtered.slice(start, start + perPage)

    return NextResponse.json({
      payouts: paginated,
      total,
      page,
      per_page: perPage,
    })
  } catch (e) {
    console.error("Admin payouts GET error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
