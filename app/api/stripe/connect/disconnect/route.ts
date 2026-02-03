import { NextRequest, NextResponse } from "next/server"
import { getServerUserAndRole } from "@/lib/supabase/server"
import { createServerSupabase } from "@/lib/supabase/server"

/**
 * POST /api/stripe/connect/disconnect
 * Clears the store's Stripe Connect account (stripe_account_id, stripe_onboarding_complete).
 * Vendor can then connect a different Stripe account. Vendor only, for their own store.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const storeId = body.storeId ?? body.store_id
    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 })
    }

    const supabase = createServerSupabase(token)

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, vendor_id")
      .eq("id", storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, user_id")
      .eq("id", store.vendor_id)
      .single()

    if (!vendor || vendor.user_id !== auth.user.id) {
      return NextResponse.json({ error: "Not your store" }, { status: 403 })
    }

    const { error: updateError } = await supabase
      .from("stores")
      .update({
        stripe_account_id: null,
        stripe_onboarding_complete: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId)

    if (updateError) {
      return NextResponse.json({ error: "Failed to disconnect Stripe" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Stripe account disconnected" })
  } catch (e: unknown) {
    console.error("Stripe Connect disconnect error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to disconnect" },
      { status: 500 }
    )
  }
}
