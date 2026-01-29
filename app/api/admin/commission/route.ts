import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, getServerUserAndRole } from "@/lib/supabase/server"
import { supabase } from "@/lib/supabase/client"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("commission_percent")
      .eq("id", "default")
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to load commission" }, { status: 500 })
    }
    return NextResponse.json({
      commission_percent: data?.commission_percent ?? 10,
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

    if (isNaN(commission_percent) || commission_percent < 0 || commission_percent > 100) {
      return NextResponse.json(
        { error: "Commission must be between 0 and 100" },
        { status: 400 }
      )
    }

    const serverSupabase = createServerSupabase(token)
    const { error } = await serverSupabase
      .from("platform_settings")
      .update({
        commission_percent: Math.round(commission_percent * 100) / 100,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "default")

    if (error) {
      return NextResponse.json({ error: "Failed to update commission" }, { status: 500 })
    }
    return NextResponse.json({ success: true, commission_percent })
  } catch (e) {
    console.error("Commission PATCH error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
