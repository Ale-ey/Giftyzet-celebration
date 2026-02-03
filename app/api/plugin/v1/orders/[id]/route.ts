import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getPluginIntegrationFromRequest } from '@/lib/plugin-api/auth'

/**
 * GET /api/plugin/v1/orders/:id
 * Get a plugin order by Giftyzet order ID.
 * Headers: X-API-Key (required)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key')
    const integration = await getPluginIntegrationFromRequest(apiKey)
    if (!integration) {
      return NextResponse.json(
        { error: 'Invalid or missing API key. Use X-API-Key header.' },
        { status: 401 }
      )
    }

    const { id } = await params
    if (!id || id.length < 30) {
      return NextResponse.json(
        { error: 'Valid order id is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase.rpc('get_plugin_order', {
      api_key: apiKey!.trim(),
      p_order_id: id,
      p_external_order_id: null,
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
    console.error('Plugin GET order by id error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
