import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleSupabase, createServerSupabase, getServerUserAndRole } from "@/lib/supabase/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim()
    const auth = await getServerUserAndRole(token)
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: storeId } = await params
    if (!storeId) {
      return NextResponse.json({ error: "Store ID required" }, { status: 400 })
    }

    const supabase = createServiceRoleSupabase() ?? createServerSupabase(token)
    const { data, error } = await supabase
      .from("stores")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: auth.user.id,
        suspended_at: null,
      })
      .eq("id", storeId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, store: data })
  } catch (e) {
    console.error("Admin approve store error:", e)
    return NextResponse.json({ error: "Failed to approve store" }, { status: 500 })
  }
}
