import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { getServerUserAndRole } from '@/lib/supabase/server'
import { createServerSupabase } from '@/lib/supabase/server'

const API_KEY_PREFIX = 'gfty_live_'

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error:
        'POST /api/admin/plugin-integrations is disabled. Plugin API keys are created from the vendor dashboard (/api/vendor/plugin-integration). Admins can only view and delete keys here.',
    },
    { status: 410 }
  )
}

/**
 * GET /api/admin/plugin-integrations
 * List plugin integrations with API key (for admin copy). Admin only.
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
      .select('id, name, store_id, vendor_id, fee_per_order, api_key_prefix, api_key_plain, is_active, created_at, stores(name)')
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

/**
 * DELETE /api/admin/plugin-integrations?integration_id=...
 * Delete a plugin integration (API key). Admin only.
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integrationId = req.nextUrl.searchParams.get('integration_id')
    if (!integrationId || !integrationId.trim()) {
      return NextResponse.json(
        { error: 'integration_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase(token)

    const { data: integration, error: fetchError } = await supabase
      .from('plugin_integrations')
      .select('id')
      .eq('id', integrationId.trim())
      .maybeSingle()

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from('plugin_integrations')
      .delete()
      .eq('id', integration.id)

    if (deleteError) {
      console.error('Admin plugin-integrations DELETE error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete integration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Admin plugin-integrations DELETE error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
