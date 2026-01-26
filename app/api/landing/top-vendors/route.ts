import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "4")

    // Get approved vendors with their product counts and ratings
    const { data: vendors, error } = await supabase
      .from("vendor_accounts")
      .select(`
        id,
        vendor_name,
        description,
        logo_url,
        status,
        stores (
          id,
          products (
            id,
            rating
          )
        )
      `)
      .eq("status", "approved")
      .limit(limit * 2) // Get more to filter later

    if (error) {
      console.error("Error fetching vendors:", error)
      return NextResponse.json(
        { vendors: [], error: error.message },
        { status: 500 }
      )
    }

    // Calculate product counts and average ratings for each vendor
    const vendorsWithStats = vendors?.map((vendor: any) => {
      let totalProducts = 0
      let totalRating = 0
      let ratingCount = 0

      vendor.stores?.forEach((store: any) => {
        const products = store.products || []
        totalProducts += products.length

        products.forEach((product: any) => {
          if (product.rating) {
            totalRating += product.rating
            ratingCount++
          }
        })
      })

      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0

      return {
        id: vendor.id,
        name: vendor.vendor_name,
        description: vendor.description || "",
        logo_url: vendor.logo_url || null,
        product_count: totalProducts,
        rating: averageRating,
      }
    }) || []

    // Sort by product count and rating, then limit
    const sortedVendors = vendorsWithStats
      .sort((a, b) => {
        // First by product count
        if (b.product_count !== a.product_count) {
          return b.product_count - a.product_count
        }
        // Then by rating
        return b.rating - a.rating
      })
      .slice(0, limit)

    return NextResponse.json({
      vendors: sortedVendors,
      success: true,
    })
  } catch (error: any) {
    console.error("Error in top vendors API:", error)
    return NextResponse.json(
      { vendors: [], error: error.message },
      { status: 500 }
    )
  }
}
