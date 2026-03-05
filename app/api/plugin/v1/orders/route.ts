import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceRoleSupabase } from '@/lib/supabase/server'
import { getPluginIntegrationFromRequest, getPluginApiKeyFromHeaders, PLUGIN_API_KEY_MISSING, getPluginApiKeyInvalidMessage } from '@/lib/plugin-api/auth'
import { shapePluginOrderResponse } from '@/lib/plugin-api/orders'
import { stripe } from '@/lib/stripe/config'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '') || 'https://www.giftyzel.com'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@giftyzel.com'
const FROM_DISPLAY = `Giftyzel Team <${FROM_EMAIL}>`

/**
 * POST /api/plugin/v1/orders
 * DEPRECATED: Orders are now created automatically by the Stripe webhook after payment succeeds.
 * Do not call this endpoint; use POST /api/plugin/v1/checkout + Stripe webhook instead.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error:
        'POST /api/plugin/v1/orders is deprecated. Orders are created automatically by the Stripe webhook after payment succeeds. Use POST /api/plugin/v1/checkout and configure the /api/stripe/plugin-webhook endpoint in your Stripe dashboard.',
    },
    { status: 410 }
  )
}

/**
 * GET /api/plugin/v1/orders
 * - With query external_order_id=... : get a single order by external ID.
 * - Without it: list all orders for this integration (paginated with page, limit).
 * Headers: X-API-Key (required)
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = getPluginApiKeyFromHeaders(req.headers)
    if (!apiKey) {
      return NextResponse.json(
        { error: PLUGIN_API_KEY_MISSING },
        { status: 401 }
      )
    }
    const integration = await getPluginIntegrationFromRequest(apiKey)
    if (!integration) {
      return NextResponse.json(
        { error: getPluginApiKeyInvalidMessage(apiKey.length) },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleSupabase() || createServerSupabase()
    const externalOrderId = req.nextUrl.searchParams.get('external_order_id')

    // Single order by external_order_id (optional convenience)
    if (externalOrderId != null && externalOrderId.trim() !== '') {
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select(
          'id, order_number, external_order_id, status, payment_status, total, subtotal, shipping, tax, created_at, confirmed_at, gift_token, gift_link, sender_name, sender_email, sender_phone, sender_address, receiver_name, receiver_email, receiver_phone, receiver_address'
        )
        .eq('plugin_integration_id', integration.id)
        .eq('external_order_id', externalOrderId.trim())
        .maybeSingle()

      if (orderErr) {
        console.error('Plugin GET order by external_order_id error:', orderErr)
        return NextResponse.json(
          { error: orderErr.message || 'Failed to fetch order' },
          { status: 500 }
        )
      }
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found or access denied' },
          { status: 404 }
        )
      }

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id, name, price, quantity, item_type, product_id, service_id, image_url')
        .eq('order_id', order.id)

      return NextResponse.json(
        shapePluginOrderResponse(order as Record<string, unknown>, (orderItems ?? []) as unknown[])
      )
    }

    // List orders for this integration
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    const { data: orders, error: listError } = await supabase
      .from('orders')
      .select(
        'id, order_number, external_order_id, status, payment_status, total, subtotal, shipping, tax, created_at, confirmed_at, sender_name, sender_email, receiver_name, receiver_email'
      )
      .eq('plugin_integration_id', integration.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (listError) {
      console.error('Plugin list orders error:', listError)
      return NextResponse.json(
        { error: listError.message || 'Failed to list orders' },
        { status: 500 }
      )
    }

    const { count, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('plugin_integration_id', integration.id)

    const total = countError ? (orders?.length ?? 0) : (count ?? 0)
    return NextResponse.json({
      orders: orders || [],
      pagination: { page, limit, total },
    })
  } catch (e) {
    console.error('Plugin GET orders error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
