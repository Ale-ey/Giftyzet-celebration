import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, getServerUserAndRole } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get("store_id")
    if (!storeId) {
      return NextResponse.json({ error: "store_id required" }, { status: 400 })
    }

    const supabase = createServerSupabase(token)

    const { data: store } = await supabase
      .from("stores")
      .select("id, vendor_id")
      .eq("id", storeId)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("user_id")
      .eq("id", store.vendor_id)
      .single()

    if (!vendor || vendor.user_id !== auth.user.id) {
      return NextResponse.json({ error: "Not your store" }, { status: 403 })
    }

    await supabase
      .from("stores")
      .update({
        stripe_onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Stripe Connect complete error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
