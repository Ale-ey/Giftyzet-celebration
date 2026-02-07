import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Get Supabase client for server (e.g. API routes).
 * To run as a specific user, pass their JWT so RLS applies.
 */
export function createServerSupabase(accessToken?: string | null) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    ...(accessToken && {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }),
  })
}

/**
 * Service-role client (bypasses RLS). Use only in server code after verifying admin.
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 */
export function createServiceRoleSupabase() {
  if (!supabaseServiceRoleKey) return null
  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

/**
 * Get current user and role from Bearer token.
 * Returns { user, role } or null.
 */
export async function getServerUserAndRole(token: string | null | undefined) {
  if (!token) return null
  const supabase = createServerSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  return { user, role: profile?.role ?? 'user' }
}
