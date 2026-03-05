import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceRoleSupabase } from '@/lib/supabase/server'
import { getPluginIntegrationFromRequest, getPluginApiKeyFromHeaders, PLUGIN_API_KEY_MISSING, getPluginApiKeyInvalidMessage } from '@/lib/plugin-api/auth'
import { stripe } from '@/lib/stripe/config'

/**
 * POST /api/plugin/v1/checkout
 * Create a Stripe Checkout Session (hosted page) for a plugin order.
 * Flow:
 * 1) Plugin backend calls this endpoint with sender/receiver/items.
 * 2) Response returns a `url` and `session_id` for Stripe Checkout.
 * 3) Plugin frontend redirects customer to `url` (Stripe shows amount + card form).
 * 4) After payment succeeds, Stripe calls /api/stripe/plugin-webhook which creates the order automatically.
 *
 * Headers: X-API-Key (required)
 */
export async function POST(req: NextRequest) {
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

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured on the server.' },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const {
      external_order_id,
      sender_name,
      sender_email,
      sender_phone,
      sender_address,
      receiver_email,
      items,
      redirect_checkout,
      success_url,
      cancel_url,
    } = body

    if (!sender_name || !sender_email || !sender_phone || !sender_address) {
      return NextResponse.json(
        { error: 'sender_name, sender_email, sender_phone, sender_address are required' },
        { status: 400 }
      )
    }
    if (!receiver_email || typeof receiver_email !== 'string' || !receiver_email.trim()) {
      return NextResponse.json(
        { error: 'receiver_email is required' },
        { status: 400 }
      )
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items must be a non-empty array (name, price, quantity?)' },
        { status: 400 }
      )
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

    const subtotalNum = itemsPayload.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0)
    if (subtotalNum <= 0) {
      return NextResponse.json(
        { error: 'Items must have positive prices' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleSupabase() || createServerSupabase()
    const { data: taxSettings } = await supabase.from('platform_settings').select('plugin_tax').eq('id', 'default').single()
    const taxPercent = Number((taxSettings as any)?.plugin_tax ?? 0) || 0
    const taxNum = Math.round((subtotalNum * taxPercent / 100) * 100) / 100
    const totalNum = Math.round((subtotalNum + taxNum) * 100) / 100

    const amount = Math.round(totalNum * 100) // cents

    const externalId =
      typeof external_order_id === 'string' && external_order_id.trim() !== ''
        ? external_order_id.trim()
        : ''

    const metadata = {
      integration_id: integration.id,
      external_order_id: externalId,
      sender_name: String(sender_name).trim(),
      sender_email: String(sender_email).trim(),
      sender_phone: String(sender_phone).trim(),
      sender_address: String(sender_address).trim(),
      receiver_email: String(receiver_email).trim(),
      items: JSON.stringify(itemsPayload),
    }

    // Always use Stripe hosted Checkout page – user sees amount, enters card, pays; webhook creates order
    const baseUrl =
      (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '') ||
      (req.headers.get('origin') || 'http://localhost:3000').replace(/\/+$/, '')

    const success = typeof success_url === 'string' && success_url.trim()
      ? success_url.trim()
      : `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}&type=self`
    const cancel = typeof cancel_url === 'string' && cancel_url.trim()
      ? cancel_url.trim()
      : `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}&type=self`

    const lineItems: {
      price_data: { currency: string; product_data: { name: string }; unit_amount: number }
      quantity: number
    }[] = itemsPayload.map((i: { name: string; price: number; quantity: number }) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: i.name },
        unit_amount: Math.round(Number(i.price) * 100),
      },
      quantity: i.quantity,
    }))
    if (taxNum > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Tax' },
          unit_amount: Math.round(taxNum * 100),
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: success,
      cancel_url: cancel,
      payment_intent_data: { metadata },
    })

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
      amount,
      subtotal: subtotalNum,
      tax: taxNum,
      total: totalNum,
      message:
        'Redirect the customer to url to complete payment on Stripe. After payment, Stripe webhook will create the order automatically.',
    })
  } catch (e) {
    console.error('Plugin checkout POST error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

