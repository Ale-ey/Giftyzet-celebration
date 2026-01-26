import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return predefined categories
    // In a real app, you might want to fetch categories from the database
    // based on actual products/services available
    
    const categories = [
      { id: "electronics", name: "Electronics", icon: "smartphone", count: 0 },
      { id: "beauty", name: "Beauty", icon: "lipstick", count: 0 },
      { id: "home", name: "Home", icon: "home", count: 0 },
      { id: "food", name: "Food", icon: "cake", count: 0 },
      { id: "fashion", name: "Fashion", icon: "shirt", count: 0 },
      { id: "experiences", name: "Experiences", icon: "heart", count: 0 },
      { id: "cleaning", name: "Cleaning", icon: "spray", count: 0 },
      { id: "catering", name: "Catering", icon: "chef-hat", count: 0 },
      { id: "home-tenders", name: "Home Tenders", icon: "key", count: 0 },
      { id: "all-gifts", name: "All Gifts", icon: "gift-box", count: 0 },
    ]

    return NextResponse.json({
      categories,
      count: categories.length
    })
  } catch (error: any) {
    console.error("Error in categories API:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
