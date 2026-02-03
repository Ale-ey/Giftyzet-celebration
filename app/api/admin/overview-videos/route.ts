import { NextRequest, NextResponse } from "next/server"
import { getServerUserAndRole } from "@/lib/supabase/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { supabase } from "@/lib/supabase/client"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("overview_video_gifting_url, overview_video_vendor_url")
      .eq("id", "default")
      .single()

    if (error) {
      return NextResponse.json(
        { giftingVideoUrl: "", vendorVideoUrl: "" },
        { status: 200 }
      )
    }
    return NextResponse.json({
      giftingVideoUrl: data?.overview_video_gifting_url ?? "",
      vendorVideoUrl: data?.overview_video_vendor_url ?? "",
    })
  } catch (e) {
    console.error("Admin overview videos GET error:", e)
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
    const giftingVideoUrl =
      typeof body.giftingVideoUrl === "string" ? body.giftingVideoUrl.trim() || null : null
    const vendorVideoUrl =
      typeof body.vendorVideoUrl === "string" ? body.vendorVideoUrl.trim() || null : null

    const serverSupabase = createServerSupabase(token)
    const { error } = await serverSupabase
      .from("platform_settings")
      .update({
        overview_video_gifting_url: giftingVideoUrl,
        overview_video_vendor_url: vendorVideoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "default")

    if (error) {
      return NextResponse.json({ error: "Failed to update overview videos" }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      giftingVideoUrl: giftingVideoUrl ?? "",
      vendorVideoUrl: vendorVideoUrl ?? "",
    })
  } catch (e) {
    console.error("Admin overview videos PATCH error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
