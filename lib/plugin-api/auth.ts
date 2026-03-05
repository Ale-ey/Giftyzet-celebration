import { createHash } from 'crypto'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceRoleSupabase } from '@/lib/supabase/server'

/** Normalize key: trim, collapse whitespace, remove CR/LF (so comparison matches DB). */
function normalizeKey(key: string): string {
  return key.replace(/\r\n|\r|\n/g, '').replace(/\s+/g, ' ').trim()
}

/** Use when no key found in request */
export const PLUGIN_API_KEY_MISSING =
  'Missing API key. Send header X-API-Key: <your-key> or Authorization: Bearer <your-key> (no quotes; full key from Vendor Store setup or Admin).'

/** Use when key was sent but validation failed. Call with (keyLength) to include a hint. */
export function getPluginApiKeyInvalidMessage(keyLength?: number): string {
  const hint = keyLength != null
    ? ` Received key length: ${keyLength}. Expected: 58 chars starting with gfty_live_.`
    : ''
  return `API key not recognized.${hint} Try: (1) Copy the full key again from Vendor Store setup (Plugin API key). (2) In Supabase run migration 20260217_plugin_api_key_normalize.sql if not applied. (3) In table plugin_integrations ensure is_active is true and api_key_plain is set.`
}

/** Legacy: use getPluginApiKeyInvalidMessage(keyLength) when key was sent but invalid */
export const PLUGIN_API_KEY_INVALID = getPluginApiKeyInvalidMessage()

export interface PluginIntegration {
  id: string
  store_id: string
  vendor_id: string
  fee_per_order: number
  name: string
}

function shapeIntegration(row: Record<string, unknown>): PluginIntegration | null {
  if (!row.id || !row.store_id || !row.vendor_id) return null
  const fee = Number(row.fee_per_order)
  if (isNaN(fee) || fee < 0) return null
  return {
    id: String(row.id),
    store_id: String(row.store_id),
    vendor_id: String(row.vendor_id),
    fee_per_order: fee,
    name: String(row.name || ''),
  }
}

/**
 * Validates plugin API key and returns integration.
 * 1) Tries RPC get_plugin_integration_by_api_key (hash or plain; works with anon).
 * 2) Falls back to direct SELECT by api_key_plain (needs service role to bypass RLS).
 */
export async function getPluginIntegrationFromRequest(
  apiKey: string | null | undefined
): Promise<PluginIntegration | null> {
  const key = typeof apiKey === 'string' ? normalizeKey(apiKey) : ''
  if (!key || key.length < 16) {
    return null
  }
  const serviceSupabase = createServiceRoleSupabase()
  const supabase = serviceSupabase || createServerSupabase()
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_plugin_integration_by_api_key', {
    api_key: key,
  })
  if (!error && data != null) {
    const out = shapeIntegration(data as Record<string, unknown>)
    if (out) return out
  }

  if (serviceSupabase) {
    const { data: row, error: rowError } = await serviceSupabase
      .from('plugin_integrations')
      .select('id, store_id, vendor_id, fee_per_order, name')
      .eq('is_active', true)
      .eq('api_key_plain', key)
      .maybeSingle()
    if (!rowError && row != null) {
      const out = shapeIntegration(row as Record<string, unknown>)
      if (out) return out
    }

    const keyHash = createHash('sha256').update(key, 'utf8').digest('hex')
    const { data: rowByHash, error: hashError } = await serviceSupabase
      .from('plugin_integrations')
      .select('id, store_id, vendor_id, fee_per_order, name')
      .eq('is_active', true)
      .eq('api_key_hash', keyHash)
      .maybeSingle()
    if (!hashError && rowByHash != null) {
      const out = shapeIntegration(rowByHash as Record<string, unknown>)
      if (out) return out
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Plugin API] Key not recognized. Length:', key.length, 'Prefix:', key.slice(0, 12) + '…')
    if (serviceSupabase) {
      const { data: anyRow } = await serviceSupabase.from('plugin_integrations').select('id, api_key_prefix, is_active').eq('is_active', true).limit(1).maybeSingle()
      if (anyRow) console.warn('[Plugin API] Sample DB row prefix:', (anyRow as { api_key_prefix?: string }).api_key_prefix)
    }
  }
  return null
}

/**
 * Extract plugin API key from request headers.
 * Accepts: X-API-Key, x-api-key, or Authorization: Bearer <key>.
 * Tries both canonical and lowercase header names. Lenient on Bearer (extra spaces, etc.).
 */
export function getPluginApiKeyFromHeaders(headers: Headers): string | null {
  const get = (name: string) => headers.get(name) ?? headers.get(name.toLowerCase())
  const minLen = 16 // full key is gfty_live_ + 48 hex chars

  const fromXApiKey = get('X-API-Key') ?? get('x-api-key')
  if (fromXApiKey && typeof fromXApiKey === 'string') {
    const k = normalizeKey(fromXApiKey)
    if (k.length >= minLen) return k
  }

  const auth = get('Authorization') ?? get('authorization')
  if (auth && typeof auth === 'string') {
    const afterBearer = normalizeKey(auth).replace(/^\s*Bearer\s*/i, '').trim()
    if (afterBearer.length >= minLen) return afterBearer
  }

  return null
}
