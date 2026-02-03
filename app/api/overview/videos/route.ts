import { NextResponse } from "next/server"
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
        { giftingVideoUrl: null, vendorVideoUrl: null },
        { status: 200 }
      )
    }
    return NextResponse.json({
      giftingVideoUrl: data?.overview_video_gifting_url ?? null,
      vendorVideoUrl: data?.overview_video_vendor_url ?? null,
    })
  } catch (e) {
    console.error("Overview videos GET error:", e)
    return NextResponse.json(
      { giftingVideoUrl: null, vendorVideoUrl: null },
      { status: 200 }
    )
  }
}
