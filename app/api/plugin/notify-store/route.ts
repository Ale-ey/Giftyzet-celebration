import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabase } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@giftyzel.com'
const FROM_DISPLAY = `Giftyzel Team <${FROM_EMAIL}>`

/**
 * POST /api/plugin/notify-store
 * Called after receiver confirms (gift link). Sends email to the plugin store's contact email with full receiver address and details.
 * Body: { gift_token: string }
 * No API key required (gift_token is the secret).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { gift_token } = body
    if (!gift_token || typeof gift_token !== 'string' || !gift_token.trim()) {
      return NextResponse.json({ error: 'gift_token is required' }, { status: 400 })
    }

    const supabase = createServiceRoleSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, order_type, plugin_store_notify_email, plugin_integration_id, sender_name, sender_email, sender_phone, sender_address, receiver_name, receiver_email, receiver_phone, receiver_address, total')
      .eq('gift_token', gift_token.trim())
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    let notifyEmail = (order as any).plugin_store_notify_email as string | null | undefined
    if ((!notifyEmail || !notifyEmail.trim()) && (order as any).order_type === 'plugin') {
      // Fallback: look up store email from plugin integration if plugin_store_notify_email is missing
      const integrationId = (order as any).plugin_integration_id as string | null | undefined
      if (integrationId) {
        const { data: integ } = await supabase
          .from('plugin_integrations')
          .select('store_id')
          .eq('id', integrationId)
          .maybeSingle()
        const storeId = (integ as any)?.store_id as string | null | undefined
        if (storeId) {
          const { data: store } = await supabase
            .from('stores')
            .select('email')
            .eq('id', storeId)
            .maybeSingle()
          notifyEmail = (store as any)?.email as string | null | undefined
        }
      }
    }

    if (!notifyEmail || !String(notifyEmail).trim() || (order as any).order_type !== 'plugin') {
      return NextResponse.json({ ok: true, message: 'No store notification needed' })
    }

    const { data: items } = await supabase
      .from('order_items')
      .select('name, price, quantity')
      .eq('order_id', order.id)

    const itemsList = (items || []).map((i: any) => `${i.name} – $${Number(i.price).toFixed(2)} x ${i.quantity || 1}`).join('<br/>')

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: FROM_DISPLAY,
        to: String(notifyEmail).trim(),
        subject: `[Giftyzel] Receiver confirmed – delivery details for order ${(order as any).order_number}`,
        html: `
          <p>The receiver has confirmed their details for your gift order. Full delivery information:</p>
          <p><strong>Order:</strong> ${(order as any).order_number}</p>
          <h3>Sender</h3>
          <p>${(order as any).sender_name}<br/>${(order as any).sender_email}<br/>${(order as any).sender_phone || ''}<br/>${(order as any).sender_address || ''}</p>
          <h3>Receiver (delivery address)</h3>
          <p>${(order as any).receiver_name || ''}<br/>${(order as any).receiver_email || ''}<br/>${(order as any).receiver_phone || ''}<br/><strong>Address:</strong><br/>${(order as any).receiver_address || ''}</p>
          <p><strong>Items:</strong><br/>${itemsList}</p>
          <p><strong>Total:</strong> $${Number((order as any).total).toFixed(2)}</p>
        `,
      }).catch((err) => console.error('Plugin notify-store email error:', err))
    }

    return NextResponse.json({ ok: true, message: 'Store notified' })
  } catch (e) {
    console.error('Plugin notify-store error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
