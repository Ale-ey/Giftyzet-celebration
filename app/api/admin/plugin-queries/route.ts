import { NextRequest, NextResponse } from "next/server"
import { getServerUserAndRole } from "@/lib/supabase/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serverSupabase = createServerSupabase(token)
    const { data, error } = await serverSupabase
      .from("plugin_queries")
      .select("id, name, email, phone, query, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to load plugin queries" }, { status: 500 })
    }
    return NextResponse.json({ submissions: data ?? [] })
  } catch (e) {
    console.error("Admin plugin-queries GET error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
