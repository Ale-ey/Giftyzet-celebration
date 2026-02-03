import { NextRequest, NextResponse } from 'next/server'
import { getServerUserAndRole } from '@/lib/supabase/server'
import { createServerSupabase } from '@/lib/supabase/server'

export interface PluginOrderRow {
  id: string
  order_number: string
  external_order_id: string | null
  store_name: string
  vendor_name: string
  integration_name: string
  status: string
  payment_status: string
  total: number
  commission_percent: number
  commission_amount: number
  plugin_fee: number
  vendor_amount: number
  created_at: string
  confirmed_at: string | null
}

/**
 * GET /api/admin/plugin-orders
 * Returns all plugin orders with store, vendor, commission and plugin fee. Admin only.
 * Query: page, per_page (default 20), status (all|pending|confirmed|...)
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabase(token)
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)))
    const statusFilter = (searchParams.get('status') || 'all').toLowerCase()

    const { data: settings } = await supabase
      .from('platform_settings')
      .select('commission_percent')
      .eq('id', 'default')
      .single()
    const commissionPercent = Number(settings?.commission_percent ?? 10)

    let query = supabase
      .from('orders')
      .select('id, order_number, external_order_id, status, payment_status, total, plugin_fee, plugin_integration_id, created_at, confirmed_at')
      .eq('order_type', 'plugin')
      .not('plugin_integration_id', 'is', null)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      console.error('Plugin orders list error:', ordersError)
      return NextResponse.json(
        { error: ordersError.message || 'Failed to load plugin orders' },
        { status: 500 }
      )
    }

    if (!orders?.length) {
      return NextResponse.json({
        orders: [],
        total: 0,
        page: 1,
        per_page: perPage,
      })
    }

    const integrationIds = [...new Set(orders.map((o) => o.plugin_integration_id).filter(Boolean))] as string[]
    const { data: integrations } = await supabase
      .from('plugin_integrations')
      .select('id, store_id, vendor_id, name')
      .in('id', integrationIds)
    const integrationMap = new Map((integrations || []).map((i) => [i.id, i]))

    const storeIds = [...new Set((integrations || []).map((i) => i.store_id))]
    const vendorIds = [...new Set((integrations || []).map((i) => i.vendor_id))]
    const { data: stores } = await supabase.from('stores').select('id, name').in('id', storeIds)
    const { data: vendors } = await supabase.from('vendors').select('id, vendor_name, business_name').in('id', vendorIds)
    const storeMap = new Map((stores || []).map((s) => [s.id, s]))
    const vendorMap = new Map((vendors || []).map((v) => [v.id, v]))

    const rows: PluginOrderRow[] = orders.map((o) => {
      const integ = o.plugin_integration_id ? integrationMap.get(o.plugin_integration_id) : null
      const store = integ ? storeMap.get(integ.store_id) : null
      const vendor = integ ? vendorMap.get(integ.vendor_id) : null
      const orderTotal = Number(o.total) || 0
      const pluginFee = Number(o.plugin_fee) || 0
      const commissionAmount = Math.round((orderTotal * commissionPercent) / 100 * 100) / 100
      const vendorAmount = Math.max(0, Math.round((orderTotal - commissionAmount - pluginFee) * 100) / 100)

      return {
        id: o.id,
        order_number: o.order_number,
        external_order_id: o.external_order_id || null,
        store_name: store?.name || '—',
        vendor_name: vendor?.business_name || vendor?.vendor_name || '—',
        integration_name: integ?.name || '—',
        status: o.status,
        payment_status: o.payment_status,
        total: orderTotal,
        commission_percent: commissionPercent,
        commission_amount: commissionAmount,
        plugin_fee: pluginFee,
        vendor_amount: vendorAmount,
        created_at: o.created_at,
        confirmed_at: o.confirmed_at || null,
      }
    })

    const total = rows.length
    const start = (page - 1) * perPage
    const paginated = rows.slice(start, start + perPage)

    return NextResponse.json({
      orders: paginated,
      total,
      page,
      per_page: perPage,
    })
  } catch (e) {
    console.error('Admin plugin-orders GET error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
