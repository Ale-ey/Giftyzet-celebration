import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, getServerUserAndRole } from "@/lib/supabase/server"
import { supabase } from "@/lib/supabase/client"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("commission_percent, tax_percent, plugin_tax")
      .eq("id", "default")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
    }
    return NextResponse.json({
      commission_percent: data?.commission_percent ?? 10,
      tax_percent: data?.tax_percent ?? 8,
      plugin_tax: data?.plugin_tax ?? 0,
    })
  } catch (e) {
    console.error("Commission GET error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const commission_percent = typeof body.commission_percent === "number"
      ? body.commission_percent
      : parseFloat(body.commission_percent)
    const tax_percent =
      body.tax_percent !== undefined
        ? typeof body.tax_percent === "number"
          ? body.tax_percent
          : parseFloat(body.tax_percent)
        : undefined
    const plugin_tax =
      body.plugin_tax !== undefined
        ? typeof body.plugin_tax === "number"
          ? body.plugin_tax
          : parseFloat(body.plugin_tax)
        : undefined

    if (isNaN(commission_percent) || commission_percent < 0 || commission_percent > 100) {
      return NextResponse.json(
        { error: "Commission must be between 0 and 100" },
        { status: 400 }
      )
    }
    if (
      tax_percent !== undefined &&
      (isNaN(tax_percent) || tax_percent < 0 || tax_percent > 100)
    ) {
      return NextResponse.json(
        { error: "Tax % must be between 0 and 100" },
        { status: 400 }
      )
    }

    const serverSupabase = createServerSupabase(token)
    const updates: Record<string, unknown> = {
      commission_percent: Math.round(commission_percent * 100) / 100,
      updated_at: new Date().toISOString(),
    }
    if (tax_percent !== undefined) {
      updates.tax_percent = Math.round(tax_percent * 100) / 100
    }
    if (plugin_tax !== undefined) {
      updates.plugin_tax = isNaN(plugin_tax) ? 0 : Math.round(plugin_tax * 100) / 100
    }

    const { data: current } = await serverSupabase
      .from("platform_settings")
      .select("tax_percent, plugin_tax")
      .eq("id", "default")
      .single()

    const { error } = await serverSupabase
      .from("platform_settings")
      .update(updates)
      .eq("id", "default")

    if (error) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      commission_percent,
      tax_percent: tax_percent ?? current?.tax_percent ?? 8,
      plugin_tax: plugin_tax !== undefined ? updates.plugin_tax : (current?.plugin_tax ?? 0),
    })
  } catch (e) {
    console.error("Commission PATCH error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
