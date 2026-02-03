import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, query } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Query / message is required" }, { status: 400 })
    }

    const { error } = await supabase.from("plugin_queries").insert({
      name: name.trim(),
      email: email.trim(),
      phone: typeof phone === "string" ? phone.trim() || null : null,
      query: query.trim(),
    })

    if (error) {
      console.error("Plugin query insert error:", error)
      return NextResponse.json(
        { error: "Failed to submit. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Plugin query API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
