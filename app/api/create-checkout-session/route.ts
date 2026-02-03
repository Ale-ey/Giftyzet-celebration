import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { supabase } from '@/lib/supabase/client'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, orderData, orderId } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      )
    }

    const orderIdStr = typeof orderId === 'string' ? orderId.trim() : ''
    const isValidOrderId = orderIdStr.length === 36 && /^[0-9a-f-]{36}$/i.test(orderIdStr)
    if (!isValidOrderId) {
      return NextResponse.json(
        { error: 'Invalid order' },
        { status: 400 }
      )
    }

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
      const price = typeof item.price === 'string' 
        ? parseFloat(item.price.replace(/[$₹]/g, ''))
        : parseFloat(String(item.price))
      
      const unitAmount = Math.round((isNaN(price) ? 0 : price) * 100) // Convert to cents

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description || `${item.type === 'product' ? 'Product' : 'Service'} - ${item.category || 'N/A'}`,
            images: item.image ? [item.image] : [],
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity || 1,
      }
    })

    const subtotal = items.reduce((sum: number, item: any) => {
      const price = typeof item.price === 'string' 
        ? parseFloat(item.price.replace(/[$₹]/g, ''))
        : parseFloat(String(item.price))
      return sum + (isNaN(price) ? 0 : price) * (item.quantity || 1)
    }, 0)

    // Shipping: free (no shipping line item)

    // Tax: admin-configured % from platform_settings
    let taxPercent = 8
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('tax_percent')
      .eq('id', 'default')
      .single()
    if (settings?.tax_percent != null) taxPercent = Number(settings.tax_percent)

    const taxAmount = Math.round((subtotal * taxPercent / 100) * 100)
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
            description: `Sales tax (${taxPercent}%)`,
          },
          unit_amount: taxAmount,
        },
        quantity: 1,
      })
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderIdStr}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      customer_email: orderData?.senderEmail || undefined,
      metadata: {
        orderId: orderIdStr,
        orderType: orderData?.orderType || 'self',
        senderName: orderData?.senderName || '',
        senderEmail: orderData?.senderEmail || '',
      },
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
