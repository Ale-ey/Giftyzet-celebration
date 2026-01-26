import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")

    // Try to get services with store/vendor approval status
    // First, try with stores (current schema)
    let query = supabase
      .from("services")
      .select(`
        id,
        name,
        description,
        category,
        price,
        duration,
        image_url,
        location,
        rating,
        available,
        stores!inner (
          id,
          status,
          vendors (
            vendor_name
          )
        )
      `)
      .eq("available", true)
      .eq("stores.status", "approved")
      .order("rating", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit)

    // Filter by category if provided
    if (category) {
      query = query.eq("category", category)
    }

    let { data: services, error } = await query

    // If stores join fails, try with vendor_accounts (new schema)
    if (error) {
      console.log("Trying vendor_accounts schema...")
      query = supabase
        .from("services")
        .select(`
          id,
          name,
          description,
          category,
          price,
          duration,
          image_url,
          location,
          rating,
          available,
          vendor_account_id,
          vendor_accounts (
            account_status,
            business_name
          )
        `)
        .eq("available", true)
        .order("rating", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit)

      if (category) {
        query = query.eq("category", category)
      }

      const result = await query
      services = result.data
      error = result.error
    }

    // If both fail, try without any joins (fallback)
    if (error) {
      console.error("Error fetching services:", error)
      let fallbackQuery = supabase
        .from("services")
        .select("id, name, description, category, price, duration, image_url, location, rating, available")
        .eq("available", true)
        .order("rating", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit)

      if (category) {
        fallbackQuery = fallbackQuery.eq("category", category)
      }

      const { data: servicesFallback, error: fallbackError } = await fallbackQuery

      if (fallbackError) {
        return NextResponse.json(
          { error: "Failed to fetch services", details: fallbackError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        services: (servicesFallback || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          category: s.category,
          price_per_hour: parseFloat(s.price) || 0,
          duration_hours: s.duration ? parseInt(s.duration) : 1,
          image_url: s.image_url,
          location: s.location,
          rating: parseFloat(s.rating) || 0,
          available: s.available
        })),
        count: servicesFallback?.length || 0
      })
    }

    // Filter services from approved vendors/stores only
    const approvedServices = services?.filter((service: any) => {
      // If stores relation exists, already filtered by status
      if (service.stores) {
        return service.stores.status === "approved"
      }
      // If vendor_accounts relation exists, check status
      if (service.vendor_accounts) {
        return service.vendor_accounts.account_status === "approved" || 
               service.vendor_accounts.account_status === "active"
      }
      // If no relation, include the service
      return true
    }) || []

    // Format services for response
    const formattedServices = approvedServices.map((service: any) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      price_per_hour: parseFloat(service.price) || 0,
      duration_hours: service.duration ? parseInt(service.duration) : 1,
      image_url: service.image_url,
      location: service.location,
      rating: parseFloat(service.rating) || 0,
      available: service.available
    }))

    return NextResponse.json({
      services: formattedServices,
      count: formattedServices.length
    })
  } catch (error: any) {
    console.error("Error in services API:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
