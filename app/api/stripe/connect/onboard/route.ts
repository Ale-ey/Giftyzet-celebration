import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { getServerUserAndRole } from "@/lib/supabase/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const storeId = body.storeId ?? body.store_id
    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 })
    }

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, vendor_id, email, name, stripe_account_id")
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

    let accountId = store.stripe_account_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: store.email || auth.user.email || undefined,
        capabilities: { transfers: { requested: true } },
      })
      accountId = account.id
      await supabase
        .from("stores")
        .update({
          stripe_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", storeId)
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const returnUrl = `${origin}/vendor/register-store?stripe=complete&store_id=${storeId}`
    const refreshUrl = `${origin}/vendor/register-store?stripe=refresh&store_id=${storeId}`

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (e: unknown) {
    console.error("Stripe Connect onboard error:", e)
    const message = e instanceof Error ? e.message : "Failed to create onboarding link"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
