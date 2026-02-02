import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { createServerSupabase, getServerUserAndRole } from "@/lib/supabase/server"

/**
 * POST /api/stripe/connect/dashboard-link
 * Returns a Stripe Express Dashboard login URL for the vendor's connected account.
 * Vendor can open this URL to see balance, payouts, and payments in Stripe.
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
      .select("id, vendor_id, stripe_account_id")
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

    if (!store.stripe_account_id) {
      return NextResponse.json(
        { error: "Stripe account not connected. Connect your Stripe account first." },
        { status: 400 }
      )
    }

    const loginLink = await stripe.accounts.createLoginLink(store.stripe_account_id)

    return NextResponse.json({ url: loginLink.url })
  } catch (e: unknown) {
    console.error("Stripe dashboard link error:", e)
    const message = e instanceof Error ? e.message : "Failed to create dashboard link"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
