import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getPluginIntegrationFromRequest } from '@/lib/plugin-api/auth'

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

/**
 * POST /api/plugin/v1/orders
 * Create a plugin order (external platform checkout already completed).
 * Headers: X-API-Key (required)
 * Body: CreatePluginOrderBody
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key')
    const integration = await getPluginIntegrationFromRequest(apiKey)
    if (!integration) {
      return NextResponse.json(
        { error: 'Invalid or missing API key. Use X-API-Key header.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const {
      external_order_id,
      sender_name,
      sender_email,
      sender_phone,
      sender_address,
      receiver_name,
      receiver_email,
      receiver_phone,
      items,
      subtotal,
      shipping = 0,
      tax = 0,
      total,
    } = body

    if (!external_order_id || typeof external_order_id !== 'string') {
      return NextResponse.json(
        { error: 'external_order_id is required' },
        { status: 400 }
      )
    }
    if (!sender_name || !sender_email || !sender_phone || !sender_address) {
      return NextResponse.json(
        { error: 'sender_name, sender_email, sender_phone, sender_address are required' },
        { status: 400 }
      )
    }
    if (!receiver_name || !receiver_email) {
      return NextResponse.json(
        { error: 'receiver_name and receiver_email are required' },
        { status: 400 }
      )
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items must be a non-empty array' },
        { status: 400 }
      )
    }
    const subtotalNum = Number(subtotal)
    const totalNum = Number(total)
    if (isNaN(subtotalNum) || isNaN(totalNum) || totalNum <= 0) {
      return NextResponse.json(
        { error: 'subtotal and total must be valid positive numbers' },
        { status: 400 }
      )
    }

    const giftToken = `gift-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const giftLink = `${BASE_URL.replace(/\/$/, '')}/gift-receiver/${giftToken}`

    const orderNumber = `PLUG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const pluginFee = Number(integration.fee_per_order) || 0

    const orderPayload = {
      order_number: orderNumber,
      user_id: '',
      order_type: 'plugin',
      sender_name: String(sender_name).trim(),
      sender_email: String(sender_email).trim(),
      sender_phone: String(sender_phone).trim(),
      sender_address: String(sender_address).trim(),
      receiver_name: String(receiver_name).trim(),
      receiver_email: String(receiver_email).trim(),
      receiver_phone: receiver_phone ? String(receiver_phone).trim() : '',
      receiver_address: '',
      shipping_address: '',
      subtotal: subtotalNum,
      shipping: Number(shipping) || 0,
      tax: Number(tax) || 0,
      total: totalNum,
      gift_token: giftToken,
      gift_link: giftLink,
      status: 'pending',
      plugin_integration_id: integration.id,
      external_order_id: String(external_order_id).trim(),
      plugin_fee: pluginFee,
      payment_status: 'paid',
    }

    const itemsPayload = items.map((item: { name: string; price: number; quantity?: number; image_url?: string }) => ({
      item_type: 'product',
      product_id: '',
      service_id: '',
      name: String(item.name || '').trim() || 'Item',
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
      image_url: item.image_url ? String(item.image_url).trim() : '',
    }))

    const supabase = createServerSupabase()
    const { data: orderJson, error: rpcError } = await supabase.rpc('create_order', {
      order_data: orderPayload,
      items_data: itemsPayload,
    })

    if (rpcError) {
      if (rpcError.code === '23505') {
        return NextResponse.json(
          { error: 'An order with this external_order_id already exists for your integration.' },
          { status: 409 }
        )
      }
      console.error('Plugin create_order RPC error:', rpcError)
      return NextResponse.json(
        { error: rpcError.message || 'Failed to create order' },
        { status: 500 }
      )
    }

    const order = orderJson as { id: string }
    if (!order?.id) {
      return NextResponse.json(
        { error: 'Order was not created' },
        { status: 500 }
      )
    }

    const { error: voError } = await supabase.rpc('insert_vendor_order_for_plugin', {
      p_order_id: order.id,
      p_vendor_id: integration.vendor_id,
      p_store_id: integration.store_id,
      p_plugin_integration_id: integration.id,
    })

    if (voError) {
      console.error('Plugin insert_vendor_order_for_plugin error:', voError)
      return NextResponse.json(
        { error: voError.message || 'Failed to link vendor order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      order_id: order.id,
      order_number: orderNumber,
      recipient_link: giftLink,
      gift_token: giftToken,
      status: 'pending',
      message:
        'Order created. Send recipient_link to the recipient so they can enter their delivery address.',
    })
  } catch (e) {
    console.error('Plugin POST orders error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/plugin/v1/orders?external_order_id=...
 * Get a plugin order by external_order_id.
 * Headers: X-API-Key (required)
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key')
    const integration = await getPluginIntegrationFromRequest(apiKey)
    if (!integration) {
      return NextResponse.json(
        { error: 'Invalid or missing API key. Use X-API-Key header.' },
        { status: 401 }
      )
    }

    const externalOrderId = req.nextUrl.searchParams.get('external_order_id')
    if (!externalOrderId || !externalOrderId.trim()) {
      return NextResponse.json(
        { error: 'Query parameter external_order_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase.rpc('get_plugin_order', {
      api_key: apiKey!.trim(),
      p_order_id: null,
      p_external_order_id: externalOrderId.trim(),
    })

    if (error) {
      console.error('Plugin get_plugin_order error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch order' },
        { status: 500 }
      )
    }

    if (data == null) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }

    const order = data as Record<string, unknown>
    const orderItems = order.order_items as unknown[]
    delete order.order_items
    return NextResponse.json({
      order: order,
      order_items: orderItems || [],
    })
  } catch (e) {
    console.error('Plugin GET orders error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
