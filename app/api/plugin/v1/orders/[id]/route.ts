import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceRoleSupabase } from '@/lib/supabase/server'
import { getPluginIntegrationFromRequest, getPluginApiKeyFromHeaders, PLUGIN_API_KEY_MISSING, getPluginApiKeyInvalidMessage } from '@/lib/plugin-api/auth'
import { shapePluginOrderResponse } from '@/lib/plugin-api/orders'

const ALLOWED_STATUSES = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'] as const

/**
 * GET /api/plugin/v1/orders/:id
 * Get a plugin order by Giftyzel order ID (Supabase orders.id). Returns sender and receiver information.
 * Headers: X-API-Key (required)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    if (!id || id.trim().length < 10) {
      return NextResponse.json(
        { error: 'Valid order id is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleSupabase() || createServerSupabase()
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(
        'id, order_number, external_order_id, status, payment_status, total, subtotal, shipping, tax, created_at, confirmed_at, gift_token, gift_link, sender_name, sender_email, sender_phone, sender_address, receiver_name, receiver_email, receiver_phone, receiver_address'
      )
      .eq('id', id)
      .eq('plugin_integration_id', integration.id)
      .maybeSingle()

    if (orderErr) {
      console.error('Plugin GET order by id error:', orderErr)
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
      .eq('order_id', id)

    return NextResponse.json(
      shapePluginOrderResponse(order as Record<string, unknown>, (orderItems ?? []) as unknown[])
    )
  } catch (e) {
    console.error('Plugin GET order by id error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/plugin/v1/orders/:id
 * Update order status. Allowed: pending, confirmed, dispatched, delivered, cancelled.
 * Headers: X-API-Key (required)
 * Body: { status: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    if (!id || id.trim().length < 10) {
      return NextResponse.json(
        { error: 'Valid order id is required' },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { status: newStatus } = body
    if (!newStatus || typeof newStatus !== 'string' || !ALLOWED_STATUSES.includes(newStatus as typeof ALLOWED_STATUSES[number])) {
      return NextResponse.json(
        { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleSupabase() || createServerSupabase()
    const { data: existing } = await supabase.rpc('get_plugin_order', {
      api_key: apiKey,
      p_order_id: id,
      p_external_order_id: null,
    })
    if (existing == null) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    const orderUpdate: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    }
    if (newStatus === 'confirmed') orderUpdate.confirmed_at = now
    if (newStatus === 'dispatched') orderUpdate.dispatched_at = now
    if (newStatus === 'delivered') orderUpdate.delivered_at = now
    if (newStatus === 'cancelled') orderUpdate.cancelled_at = now

    const { error: orderErr } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', id)
      .eq('plugin_integration_id', integration.id)

    if (orderErr) {
      console.error('Plugin PATCH order update error:', orderErr)
      return NextResponse.json(
        { error: orderErr.message || 'Failed to update order' },
        { status: 500 }
      )
    }

    const { error: voErr } = await supabase
      .from('vendor_orders')
      .update({
        status: newStatus,
        updated_at: now,
        ...(newStatus === 'delivered' ? { delivered_at: now } : {}),
      })
      .eq('order_id', id)
      .eq('vendor_id', integration.vendor_id)

    if (voErr) {
      console.error('Plugin PATCH vendor_order update error:', voErr)
    }

    return NextResponse.json({
      order_id: id,
      status: newStatus,
      message: 'Order status updated.',
    })
  } catch (e) {
    console.error('Plugin PATCH order error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
