import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, createServiceRoleSupabase, getServerUserAndRole } from "@/lib/supabase/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: storeId } = await params
    if (!storeId) {
      return NextResponse.json({ error: "Store ID required" }, { status: 400 })
    }

    // Prefer service role so admin can always read pending/rejected stores (bypasses RLS)
    const supabase = createServiceRoleSupabase() ?? createServerSupabase(token)

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select(`
        id,
        name,
        description,
        status,
        vendor_id,
        address,
        phone,
        email,
        category,
        created_at,
        approved_at,
        suspended_at,
        vendors (
          id,
          vendor_name,
          business_name,
          email,
          phone,
          address
        )
      `)
      .eq("id", storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: storeError?.message ?? "Store not found" },
        { status: storeError?.code === "PGRST116" ? 404 : 500 }
      )
    }

    const [productRes, serviceRes, voRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("services").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      supabase.from("vendor_orders").select("order_id").eq("store_id", storeId),
    ])

    const orderIds = (voRes.data ?? []).map((r: { order_id: string }) => r.order_id).filter(Boolean)
    let orders: Array<{ id: string; order_number: string; total: number; status: string; created_at: string; sender_name?: string }> = []
    let totalEarnings = 0
    if (orderIds.length > 0) {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, sender_name")
        .in("id", orderIds)
        .order("created_at", { ascending: false })
      if (ordersData) {
        orders = ordersData
        totalEarnings = ordersData.reduce((sum, o) => sum + Number(o.total || 0), 0)
      }
    }

    return NextResponse.json({
      store,
      productCount: productRes.count ?? 0,
      serviceCount: serviceRes.count ?? 0,
      orders,
      totalEarnings,
    })
  } catch (e) {
    console.error("Admin store detail error:", e)
    return NextResponse.json({ error: "Failed to load store" }, { status: 500 })
  }
}
