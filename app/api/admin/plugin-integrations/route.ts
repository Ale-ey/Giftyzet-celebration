import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { getServerUserAndRole } from '@/lib/supabase/server'
import { createServerSupabase } from '@/lib/supabase/server'

const API_KEY_PREFIX = 'gfty_live_'

/**
 * POST /api/admin/plugin-integrations
 * Create a plugin integration (store + API key). Admin only.
 * Body: { name, store_id, fee_per_order }
 * Response: { id, name, store_id, fee_per_order, api_key } — api_key is shown only once.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { name, store_id, fee_per_order } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }
    if (!store_id || typeof store_id !== 'string' || !store_id.trim()) {
      return NextResponse.json(
        { error: 'store_id is required' },
        { status: 400 }
      )
    }
    const fee = Number(fee_per_order)
    if (isNaN(fee) || fee < 0) {
      return NextResponse.json(
        { error: 'fee_per_order must be a non-negative number' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase(token)

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, vendor_id')
      .eq('id', store_id.trim())
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Store not found or access denied' },
        { status: 404 }
      )
    }

    const { data: existing } = await supabase
      .from('plugin_integrations')
      .select('id')
      .eq('store_id', store.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'This store already has a plugin integration. Use the existing API key or deactivate it first.' },
        { status: 409 }
      )
    }

    const rawKey = API_KEY_PREFIX + randomBytes(24).toString('hex')
    const apiKeyHash = createHash('sha256').update(rawKey).digest('hex')
    const apiKeyPrefix = rawKey.slice(0, 12) + '…'

    const { data: integration, error: insertError } = await supabase
      .from('plugin_integrations')
      .insert({
        vendor_id: store.vendor_id,
        store_id: store.id,
        name: name.trim(),
        api_key_hash: apiKeyHash,
        api_key_prefix: apiKeyPrefix,
        fee_per_order: fee,
        is_active: true,
      })
      .select('id, name, store_id, fee_per_order, api_key_prefix, created_at')
      .single()

    if (insertError) {
      console.error('Plugin integration insert error:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Failed to create integration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...integration,
      api_key: rawKey,
      message: 'Store this API key securely. It will not be shown again.',
    })
  } catch (e) {
    console.error('Admin plugin-integrations POST error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/plugin-integrations
 * List plugin integrations (no API keys). Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabase(token)
    const { data, error } = await supabase
      .from('plugin_integrations')
      .select('id, name, store_id, vendor_id, fee_per_order, api_key_prefix, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Plugin integrations list error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to list integrations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ integrations: data || [] })
  } catch (e) {
    console.error('Admin plugin-integrations GET error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
