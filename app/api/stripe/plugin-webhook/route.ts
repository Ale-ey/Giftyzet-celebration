import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createServiceRoleSupabase, createServerSupabase } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { shapePluginOrderResponse } from '@/lib/plugin-api/orders'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '') || 'https://www.giftyzel.com'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@giftyzel.com'
const FROM_DISPLAY = `Giftyzel Team <${FROM_EMAIL}>`

/**
 * POST /api/stripe/plugin-webhook
 * Stripe webhook endpoint for plugin payments. Creates orders automatically after successful payment.
 */
export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_PLUGIN
    const rawBody = await req.text()
    const sig = req.headers.get('stripe-signature') || ''

    let event: any
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
      } catch (err) {
        console.error('Stripe webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else {
      // Fallback (not recommended for production): parse without signature verification
      event = JSON.parse(rawBody)
    }

    if (event.type !== 'payment_intent.succeeded') {
      return NextResponse.json({ received: true })
    }

    const pi = event.data.object as {
      id: string
      amount_received: number
      currency: string
      metadata?: Record<string, string>
    }

    const metadata = pi.metadata || {}
    const integrationId = metadata.integration_id
    const externalOrderId = metadata.external_order_id || ''
    const senderName = metadata.sender_name
    const senderEmail = metadata.sender_email
    const senderPhone = metadata.sender_phone
    const senderAddress = metadata.sender_address
    const receiverEmail = metadata.receiver_email
    const itemsRaw = metadata.items

    if (
      !integrationId ||
      !senderName ||
      !senderEmail ||
      !senderPhone ||
      !senderAddress ||
      !receiverEmail ||
      !itemsRaw
    ) {
      console.error('Plugin webhook missing metadata, skipping order creation:', metadata)
      return NextResponse.json({ skipped: true })
    }

    const supabase = createServiceRoleSupabase() || createServerSupabase()
    if (!supabase) {
      console.error('Plugin webhook: no Supabase client available')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Prevent duplicate orders for same PaymentIntent
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_intent_id', pi.id)
      .maybeSingle()
    if (existingOrder) {
      return NextResponse.json({ ok: true, existing_order_id: existingOrder.id })
    }

    const itemsPayload = JSON.parse(itemsRaw) as {
      item_type: string
      product_id: string
      service_id: string
      name: string
      price: number
      quantity: number
      image_url?: string
    }[]

    const subtotalNum = itemsPayload.reduce(
      (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
      0
    )

    const { data: taxSettings } = await supabase
      .from('platform_settings')
      .select('plugin_tax')
      .eq('id', 'default')
      .single()
    const taxPercent = Number((taxSettings as any)?.plugin_tax ?? 0) || 0
    const taxNum = Math.round((subtotalNum * taxPercent / 100) * 100) / 100
    const totalNum = Math.round((subtotalNum + taxNum) * 100) / 100

    if (typeof pi.amount_received === 'number' && pi.amount_received !== Math.round(totalNum * 100)) {
      console.error('Plugin webhook: amount mismatch', {
        amount_received: pi.amount_received,
        expected: Math.round(totalNum * 100),
      })
      return NextResponse.json({ error: 'Amount mismatch, no order created' }, { status: 400 })
    }

    // Load integration to get vendor/store and fee_per_order
    const { data: integration, error: integErr } = await supabase
      .from('plugin_integrations')
      .select('id, vendor_id, store_id, fee_per_order')
      .eq('id', integrationId)
      .maybeSingle()
    if (integErr || !integration) {
      console.error('Plugin webhook: integration not found', integErr)
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const orderStatus = 'pending'
    const orderNumber = `PLUG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const feePercent = Number(integration.fee_per_order) || 0
    const pluginFee = Math.round((totalNum * feePercent / 100) * 100) / 100

    const giftToken = `gift-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const giftLink = `${BASE_URL}/gift-receiver/${giftToken}`

    const externalId = externalOrderId && externalOrderId.trim() !== '' ? externalOrderId.trim() : ''

    const orderPayload = {
      order_number: orderNumber,
      user_id: '',
      order_type: 'plugin',
      sender_name: senderName,
      sender_email: senderEmail,
      sender_phone: senderPhone,
      sender_address: senderAddress,
      receiver_name: '',
      receiver_email: receiverEmail,
      receiver_phone: '',
      receiver_address: '',
      shipping_address: '',
      subtotal: subtotalNum,
      shipping: 0,
      tax: taxNum,
      total: totalNum,
      gift_token: giftToken,
      gift_link: giftLink,
      status: orderStatus,
      plugin_integration_id: integration.id,
      external_order_id: externalId,
      plugin_fee: pluginFee,
      payment_status: 'paid',
    }

    const { data: orderJson, error: rpcError } = await supabase.rpc('create_order', {
      order_data: orderPayload,
      items_data: itemsPayload,
    })

    if (rpcError) {
      console.error('Plugin webhook create_order error:', rpcError)
      return NextResponse.json(
        { error: rpcError.message || 'Failed to create order' },
        { status: 500 }
      )
    }

    const order = orderJson as { id: string }
    if (!order?.id) {
      console.error('Plugin webhook: create_order returned no id')
      return NextResponse.json({ error: 'Order was not created' }, { status: 500 })
    }

    const { error: voError } = await supabase.rpc('insert_vendor_order_for_plugin', {
      p_order_id: order.id,
      p_vendor_id: integration.vendor_id,
      p_store_id: integration.store_id,
      p_plugin_integration_id: integration.id,
    })
    if (voError) {
      console.error('Plugin webhook insert_vendor_order_for_plugin error:', voError)
      // Fallback: try direct insert into vendor_orders so vendor dashboard always sees plugin orders
      const { error: directVoError } = await supabase.from('vendor_orders').insert({
        order_id: order.id,
        vendor_id: integration.vendor_id,
        store_id: integration.store_id,
        status: orderStatus,
      })
      if (directVoError) {
        console.error('Plugin webhook direct vendor_orders insert error:', directVoError)
      }
    }

    const trimOpt = (v: unknown) => (v != null && String(v).trim() !== '' ? String(v).trim() : null)
    const { data: storeRow } = await supabase
      .from('stores')
      .select('email, name, stripe_account_id')
      .eq('id', integration.store_id)
      .maybeSingle()
    const storeNotifyEmail = trimOpt((storeRow as { email?: string } | null)?.email)
    const storeName = trimOpt((storeRow as { name?: string } | null)?.name)
    const pluginStoreStripeAccountId = trimOpt(
      (storeRow as { stripe_account_id?: string } | null)?.stripe_account_id
    )

    await supabase
      .from('orders')
      .update({
        plugin_store_notify_email: storeNotifyEmail,
        plugin_store_name: storeName,
        plugin_store_phone: null,
        plugin_store_iban: null,
        plugin_store_stripe_account_id: pluginStoreStripeAccountId,
        payment_intent_id: pi.id,
        payment_status: 'paid',
      })
      .eq('id', order.id)

    if (process.env.RESEND_API_KEY && storeNotifyEmail) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('name, price, quantity')
        .eq('order_id', order.id)

      const itemsList = (orderItems || [])
        .map((i: any) => `${i.name} – $${Number(i.price).toFixed(2)} x ${i.quantity || 1}`)
        .join('<br/>')

      await resend.emails
        .send({
          from: FROM_DISPLAY,
          to: storeNotifyEmail,
          subject: `[Giftyzel] New gift order ${orderNumber} – sender info & gift link`,
          html: `
            <p>Your store received a new gift order on Giftyzel.</p>
            <p><strong>Order:</strong> ${orderNumber}</p>
            <p><strong>Sender:</strong> ${senderName} – ${senderEmail}, ${senderPhone}</p>
            <p><strong>Sender address:</strong> ${senderAddress}</p>
            <p><strong>Recipient link (send to receiver to enter delivery details):</strong><br/><a href="${giftLink}">${giftLink}</a></p>
            <p><strong>Items:</strong><br/>${itemsList}</p>
            <p><strong>Subtotal:</strong> $${subtotalNum.toFixed(2)} | <strong>Tax:</strong> $${taxNum.toFixed(
            2
          )} | <strong>Total:</strong> $${totalNum.toFixed(2)}</p>
            <p>When the receiver confirms their address via the gift link, you will receive a second email with the full delivery details.</p>
          `,
        })
        .catch((err) => console.error('Plugin webhook store email error:', err))
    }

    return NextResponse.json({ ok: true, order_id: order.id })
  } catch (e) {
    console.error('Plugin webhook error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

