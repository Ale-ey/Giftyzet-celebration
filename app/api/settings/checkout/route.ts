import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * Public API: returns checkout/landing settings (platform service %, plugin service %).
 * Used by cart, checkout page, and landing page (Sell on GiftyZel / Add Gifting to Your Store).
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("tax_percent, plugin_tax")
      .eq("id", "default")
      .single()

    if (error) {
      return NextResponse.json(
        { tax_percent: 8, plugin_tax: 0 },
        { status: 200 }
      )
    }
    const taxPercent = Number(data?.tax_percent ?? 8)
    const pluginTax = Number(data?.plugin_tax ?? 0)
    return NextResponse.json({ tax_percent: taxPercent, plugin_tax: pluginTax })
  } catch (e) {
    console.error("Checkout settings GET error:", e)
    return NextResponse.json({ tax_percent: 8, plugin_tax: 0 }, { status: 200 })
  }
}
