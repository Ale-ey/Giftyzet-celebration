import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { getServerUserAndRole, createServerSupabase } from '@/lib/supabase/server'

const API_KEY_PREFIX = 'gfty_live_'

/**
 * GET /api/vendor/plugin-integration
 * List plugin integrations for the authenticated vendor (their stores).
 * Returns integration list including api_key_plain so vendor can view and copy the full API key.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || (auth.role !== 'vendor' && auth.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized. Sign up as a vendor to access.' }, { status: 401 })
    }

    const supabase = createServerSupabase(token)
    const { data: vendorRow } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', auth.user.id)
      .single()

    if (!vendorRow?.id) {
      return NextResponse.json({ error: 'Vendor profile not found. Complete vendor signup first.' }, { status: 403 })
    }

    const { data: integrations, error } = await supabase
      .from('plugin_integrations')
      .select('id, name, store_id, fee_per_order, api_key_prefix, api_key_plain, is_active, created_at, stores(name)')
      .eq('vendor_id', vendorRow.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Vendor plugin-integration list error:', error)
      return NextResponse.json({ error: error.message || 'Failed to list integrations' }, { status: 500 })
    }

    return NextResponse.json({ integrations: integrations || [] })
  } catch (e) {
    console.error('Vendor plugin-integration GET error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vendor/plugin-integration
 * Create a plugin integration (API key) for one of the vendor's stores.
 * Body: { store_id, name } — fee_per_order is automatically taken from platform_settings.plugin_tax.
 * Returns the API key once; store it securely for use in X-API-Key header with the plugin API.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || (auth.role !== 'vendor' && auth.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized. Sign up as a vendor to get an API key.' }, { status: 401 })
    }

    const supabase = createServerSupabase(token)
    const { data: vendorRow } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', auth.user.id)
      .single()

    if (!vendorRow?.id) {
      return NextResponse.json({ error: 'Vendor profile not found. Complete vendor signup first.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { store_id: bodyStoreId, name } = body

    if (!bodyStoreId || typeof bodyStoreId !== 'string' || !bodyStoreId.trim()) {
      return NextResponse.json(
        { error: 'store_id is required (one of your stores)' },
        { status: 400 }
      )
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required (e.g. "My External Store Plugin")' },
        { status: 400 }
      )
    }

    // Plugin fee per order is taken from platform_settings.plugin_tax
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('plugin_tax')
      .eq('id', 'default')
      .single()
    const fee = Number(settings?.plugin_tax ?? 0)

    const storeId = bodyStoreId.trim()
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, vendor_id')
      .eq('id', storeId)
      .eq('vendor_id', vendorRow.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Store not found or you do not own this store.' },
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
        { error: 'This store already has a plugin integration. Use the existing API key or use a different store.' },
        { status: 409 }
      )
    }

    const rawKey = API_KEY_PREFIX + randomBytes(24).toString('hex')
    const apiKeyHash = createHash('sha256').update(rawKey).digest('hex')
    const apiKeyPrefix = rawKey.slice(0, 12) + '…'

    const { data: integration, error: insertError } = await supabase
      .from('plugin_integrations')
      .insert({
        vendor_id: vendorRow.id,
        store_id: store.id,
        name: name.trim(),
        api_key_hash: apiKeyHash,
        api_key_prefix: apiKeyPrefix,
        api_key_plain: rawKey,
        fee_per_order: fee,
        is_active: true,
      })
      .select('id, name, store_id, fee_per_order, api_key_prefix, api_key_plain, created_at')
      .single()

    if (insertError) {
      console.error('Vendor plugin-integration insert error:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Failed to create integration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...integration,
      api_key: rawKey,
      message: 'Store this API key securely. Use it in the X-API-Key header for the Plugin API.',
    })
  } catch (e) {
    console.error('Vendor plugin-integration POST error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/vendor/plugin-integration
 * Delete a plugin integration (API key) for the authenticated vendor.
 * Query: integration_id (required) – the plugin_integrations id. Vendor can only delete their own.
 * After deletion the vendor can create a new API key for that store.
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || (auth.role !== 'vendor' && auth.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const supabase = createServerSupabase(token)
    const { data: vendorRow } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', auth.user.id)
      .single()

    if (!vendorRow?.id) {
      return NextResponse.json({ error: 'Vendor profile not found.' }, { status: 403 })
    }

    const integrationId = req.nextUrl.searchParams.get('integration_id')
    if (!integrationId || !integrationId.trim()) {
      return NextResponse.json(
        { error: 'integration_id is required' },
        { status: 400 }
      )
    }

    const { data: integration, error: fetchError } = await supabase
      .from('plugin_integrations')
      .select('id, store_id')
      .eq('id', integrationId.trim())
      .eq('vendor_id', vendorRow.id)
      .maybeSingle()

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Integration not found or you do not own it.' },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from('plugin_integrations')
      .delete()
      .eq('id', integration.id)
      .eq('vendor_id', vendorRow.id)

    if (deleteError) {
      console.error('Vendor plugin-integration DELETE error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete integration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted. You can create a new one for this store.',
    })
  } catch (e) {
    console.error('Vendor plugin-integration DELETE error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
