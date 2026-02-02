import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { getServerUserAndRole } from "@/lib/supabase/server"
import { createServerSupabase } from "@/lib/supabase/server"

const PAYOUT_DAYS_AFTER_DELIVERED = 7

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabase(token)

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("commission_percent")
      .eq("id", "default")
      .single()

    const commissionPercent = Number(settings?.commission_percent ?? 10)

    let vendorOrders: Array<{ id: string; order_id: string; vendor_id: string; store_id: string; delivered_at: string | null }>

    try {
      const body = await req.json().catch(() => ({}))
      const vendorOrderIds = Array.isArray(body.vendor_order_ids)
        ? body.vendor_order_ids.filter((id: unknown) => typeof id === "string")
        : undefined

      if (vendorOrderIds?.length) {
        const { data, error } = await supabase
          .from("vendor_orders")
          .select("id, order_id, vendor_id, store_id, delivered_at")
          .eq("status", "delivered")
          .eq("payout_status", "pending")
          .in("id", vendorOrderIds)

        if (error) {
          return NextResponse.json({ error: "Failed to load selected payouts" }, { status: 500 })
        }
        vendorOrders = data || []
      } else {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - PAYOUT_DAYS_AFTER_DELIVERED)
        const { data, error } = await supabase
          .from("vendor_orders")
          .select("id, order_id, vendor_id, store_id, delivered_at")
          .eq("status", "delivered")
          .eq("payout_status", "pending")
          .not("delivered_at", "is", null)
          .lt("delivered_at", cutoff.toISOString())

        if (error) {
          return NextResponse.json({ error: "Failed to load payouts" }, { status: 500 })
        }
        vendorOrders = data || []
      }
    } catch {
      vendorOrders = []
    }

    if (!vendorOrders.length) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No payouts to process",
      })
    }

    let processed = 0
    const errors: string[] = []

    for (const vo of vendorOrders) {
      const orderId = vo.order_id
      const storeId = vo.store_id

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id, product_id, service_id, price, quantity")
        .eq("order_id", orderId)

      if (!orderItems?.length) continue

      let vendorTotal = 0
      for (const item of orderItems) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from("products")
            .select("store_id")
            .eq("id", item.product_id)
            .single()
          if (product?.store_id === storeId) {
            vendorTotal += Number(item.price) * (item.quantity || 1)
          }
        } else if (item.service_id) {
          const { data: service } = await supabase
            .from("services")
            .select("store_id")
            .eq("id", item.service_id)
            .single()
          if (service?.store_id === storeId) {
            vendorTotal += Number(item.price) * (item.quantity || 1)
          }
        }
      }

      const commissionAmount = Math.round((vendorTotal * commissionPercent) / 100 * 100) / 100
      const vendorAmount = Math.round((vendorTotal - commissionAmount) * 100) / 100
      const orderTotal = Math.round(vendorTotal * 100) / 100

      const { data: storeRow } = await supabase
        .from("stores")
        .select("stripe_account_id")
        .eq("id", storeId)
        .single()

      if (!storeRow?.stripe_account_id) {
        await supabase
          .from("vendor_orders")
          .update({
            payout_status: "failed",
            commission_amount: commissionAmount,
            vendor_amount: vendorAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vo.id)
        errors.push(`Store ${storeId}: no Stripe account`)
        continue
      }

      const amountCents = Math.round(vendorAmount * 100)
      if (amountCents < 50) {
        await supabase
          .from("vendor_orders")
          .update({
            payout_status: "paid",
            payout_at: new Date().toISOString(),
            commission_amount: commissionAmount,
            vendor_amount: vendorAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vo.id)
        await supabase.from("vendor_payouts").insert({
          vendor_order_id: vo.id,
          order_id: vo.order_id,
          vendor_id: vo.vendor_id,
          store_id: vo.store_id,
          order_total: orderTotal,
          commission_amount: commissionAmount,
          vendor_amount: vendorAmount,
          paid_at: new Date().toISOString(),
        })
        processed++
        continue
      }

      try {
        const transfer = await stripe.transfers.create({
          amount: amountCents,
          currency: "usd",
          destination: storeRow.stripe_account_id,
          description: `Payout for order ${orderId}`,
        })

        await supabase
          .from("vendor_orders")
          .update({
            payout_status: "paid",
            payout_at: new Date().toISOString(),
            commission_amount: commissionAmount,
            vendor_amount: vendorAmount,
            stripe_transfer_id: transfer.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vo.id)

        await supabase.from("vendor_payouts").insert({
          vendor_order_id: vo.id,
          order_id: vo.order_id,
          vendor_id: vo.vendor_id,
          store_id: vo.store_id,
          order_total: orderTotal,
          commission_amount: commissionAmount,
          vendor_amount: vendorAmount,
          stripe_transfer_id: transfer.id,
          paid_at: new Date().toISOString(),
        })

        processed++
      } catch (stripeErr: unknown) {
        const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
        errors.push(`Vendor order ${vo.id}: ${msg}`)
        await supabase
          .from("vendor_orders")
          .update({
            payout_status: "failed",
            commission_amount: commissionAmount,
            vendor_amount: vendorAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vo.id)
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      errors: errors.length ? errors : undefined,
    })
  } catch (e) {
    console.error("Process payouts error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    )
  }
}
