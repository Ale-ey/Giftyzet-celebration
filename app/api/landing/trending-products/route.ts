import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    // Get trending products - products with highest ratings and recent orders
    // Try to get products with store/vendor approval status
    // First, try with stores (current schema)
    let query = supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        category,
        image_url,
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

    let { data: products, error } = await query

    // If stores join fails, try with vendor_accounts (new schema)
    if (error) {
      console.log("Trying vendor_accounts schema...")
      const vendorQuery = supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          price,
          category,
          image_url,
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

      const result = await vendorQuery
      products = result.data as any
      error = result.error
    }

    // If both fail, try without any joins (fallback)
    if (error) {
      console.error("Error fetching trending products:", error)
      const { data: productsFallback, error: fallbackError } = await supabase
        .from("products")
        .select("id, name, description, price, category, image_url, rating, available")
        .eq("available", true)
        .order("rating", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit)

      if (fallbackError) {
        return NextResponse.json(
          { error: "Failed to fetch trending products", details: fallbackError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        products: (productsFallback || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: parseFloat(p.price) || 0,
          category: p.category,
          image_url: p.image_url,
          rating: parseFloat(p.rating) || 0,
          available: p.available
        })),
        count: productsFallback?.length || 0
      })
    }

    // Filter products from approved vendors/stores only
    const approvedProducts = products?.filter((product: any) => {
      // If stores relation exists, already filtered by status
      if (product.stores) {
        return product.stores.status === "approved"
      }
      // If vendor_accounts relation exists, check status
      if (product.vendor_accounts) {
        return product.vendor_accounts.account_status === "approved" || 
               product.vendor_accounts.account_status === "active"
      }
      // If no relation, include the product
      return true
    }) || []

    // Format products for response
    const formattedProducts = approvedProducts.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price) || 0,
      category: product.category,
      image_url: product.image_url,
      rating: parseFloat(product.rating) || 0,
      available: product.available
    }))

    return NextResponse.json({
      products: formattedProducts,
      count: formattedProducts.length
    })
  } catch (error: any) {
    console.error("Error in trending-products API:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
