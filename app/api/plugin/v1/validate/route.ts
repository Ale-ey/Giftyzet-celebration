import { NextRequest, NextResponse } from 'next/server'
import { getPluginIntegrationFromRequest, getPluginApiKeyFromHeaders, PLUGIN_API_KEY_MISSING, getPluginApiKeyInvalidMessage } from '@/lib/plugin-api/auth'

/**
 * GET /api/plugin/v1/validate
 * Check if your API key is valid. Use this to test the key before sending orders.
 * Headers: X-API-Key: <your-key>  OR  Authorization: Bearer <your-key>
 * 200: { "valid": true, "integration_name": "..." }
 * 401: { "error": "..." }
 */
export async function GET(req: NextRequest) {
  const apiKey = getPluginApiKeyFromHeaders(req.headers)
  if (!apiKey) {
    return NextResponse.json({ error: PLUGIN_API_KEY_MISSING }, { status: 401 })
  }
  const integration = await getPluginIntegrationFromRequest(apiKey)
  if (!integration) {
    return NextResponse.json({ error: getPluginApiKeyInvalidMessage(apiKey.length) }, { status: 401 })
  }
  return NextResponse.json({
    valid: true,
    integration_name: integration.name,
    message: 'API key is valid. You can use it to create and manage orders.',
  })
}
