import { createServerSupabase } from '@/lib/supabase/server'

export interface PluginIntegration {
  id: string
  store_id: string
  vendor_id: string
  fee_per_order: number
  name: string
}

/**
 * Validates plugin API key from X-API-Key header and returns integration.
 * Returns null if key is missing or invalid.
 */
export async function getPluginIntegrationFromRequest(
  apiKey: string | null | undefined
): Promise<PluginIntegration | null> {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 16) {
    return null
  }
  const supabase = createServerSupabase()
  const { data, error } = await supabase.rpc('get_plugin_integration_by_api_key', {
    api_key: apiKey.trim(),
  })
  if (error || data == null) return null
  const raw = data as Record<string, unknown>
  if (
    !raw.id ||
    !raw.store_id ||
    !raw.vendor_id ||
    typeof raw.fee_per_order !== 'number'
  ) {
    return null
  }
  return {
    id: String(raw.id),
    store_id: String(raw.store_id),
    vendor_id: String(raw.vendor_id),
    fee_per_order: Number(raw.fee_per_order),
    name: String(raw.name || ''),
  }
}
