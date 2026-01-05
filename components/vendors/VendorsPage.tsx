"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Star, Store, Award, TrendingUp, Users, ShoppingBag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { allProducts } from "@/lib/constants"
import type { Product } from "@/types"

interface Vendor {
  name: string
  category: string
  rating: number
  totalReviews: number
  totalProducts: number
  totalSales: number
  verified: boolean
  logo?: string
  description: string
  joinDate: string
}

export default function VendorsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Extract unique vendors from products
  const vendorsData = useMemo(() => {
    const vendorMap = new Map<string, {
      products: Product[]
      totalSales: number
    }>()

    allProducts.forEach(product => {
      if (!vendorMap.has(product.vendor)) {
        vendorMap.set(product.vendor, {
          products: [],
          totalSales: Math.floor(Math.random() * 5000) + 1000 // Random sales for demo
        })
      }
      vendorMap.get(product.vendor)!.products.push(product)
    })

    const vendors: Vendor[] = Array.from(vendorMap.entries()).map(([name, data]) => {
      const avgRating = data.products.reduce((sum, p) => sum + p.rating, 0) / data.products.length
      const totalReviews = data.products.reduce((sum, p) => sum + p.reviews, 0)
      const categories = [...new Set(data.products.map(p => p.category))]
      
      return {
        name,
        category: categories[0] || "General",
        rating: Math.round(avgRating * 10) / 10,
        totalReviews,
        totalProducts: data.products.length,
        totalSales: data.totalSales,
        verified: true,
        description: `Leading ${categories[0] || "general"} vendor with ${data.products.length} quality products`,
        joinDate: "2023-01-15"
      }
    })

    // Sort by rating and total sales
    return vendors.sort((a, b) => {
      const scoreA = a.rating * 1000 + a.totalSales
      const scoreB = b.rating * 1000 + b.totalSales
      return scoreB - scoreA
    })
  }, [])

  const categories = [
    { name: "All Categories", value: "all" },
    ...Array.from(new Set(vendorsData.map(v => v.category))).map(cat => ({
      name: cat,
      value: cat
    }))
  ]

  const filteredVendors = useMemo(() => {
    return vendorsData.filter(vendor => {
      const matchesSearch = 
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.category.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = 
        selectedCategory === "all" || vendor.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [vendorsData, searchQuery, selectedCategory])

  const handleVendorClick = (vendorName: string) => {
    router.push(`/vendors/${encodeURIComponent(vendorName)}`)
  }

  const handleProductClick = (productId: number) => {
    router.push(`/product/${productId}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Top Vendors</h1>
          <p className="text-gray-600 mb-6">
            Discover trusted vendors and explore their products
          </p>
          
          {/* Search Bar */}
          <div className="flex justify-center mb-6">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-6 text-base bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className={`${
                  selectedCategory === category.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Vendors Grid */}
        {filteredVendors.length === 0 ? (
          <Card className="border-2 border-gray-100">
            <CardContent className="p-12 text-center">
              <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No vendors found</p>
              <p className="text-gray-500 text-sm">
                Try adjusting your search or category filter
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => {
              const vendorProducts = allProducts.filter(p => p.vendor === vendor.name).slice(0, 3)
              return (
                <Card
                  key={vendor.name}
                  className="border-2 border-gray-100 hover:border-gray-200 bg-white transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Store className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-gray-900 flex items-center gap-2">
                            {vendor.name}
                            {vendor.verified && (
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                Verified
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-gray-600">{vendor.category}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vendor Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center justify-center mb-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="font-semibold text-sm text-gray-900">{vendor.rating}</span>
                        </div>
                        <p className="text-xs text-gray-600">Rating</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-sm text-gray-900 mb-1">
                          {vendor.totalProducts}
                        </div>
                        <p className="text-xs text-gray-600">Products</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-sm text-gray-900 mb-1">
                          {vendor.totalSales}+
                        </div>
                        <p className="text-xs text-gray-600">Sales</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {vendor.description}
                    </p>
                  </CardHeader>

                  <CardContent>
                    {/* Sample Products */}
                    {vendorProducts.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Featured Products</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {vendorProducts.map((product) => (
                            <div
                              key={product.id}
                              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
                              onClick={() => handleProductClick(product.id)}
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                              <Badge className="absolute top-1 left-1 bg-secondary text-gray-900 text-xs">
                                {product.discount}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                        onClick={() => handleVendorClick(vendor.name)}
                      >
                        View Store
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                        onClick={() => router.push(`/marketplace?vendor=${encodeURIComponent(vendor.name)}`)}
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Top Vendors Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-gray-200 bg-gray-50/50">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{vendorsData.length}</div>
              <div className="text-sm text-gray-600">Total Vendors</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 bg-gray-50/50">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {vendorsData.filter(v => v.verified).length}
              </div>
              <div className="text-sm text-gray-600">Verified Vendors</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 bg-gray-50/50">
            <CardContent className="p-6 text-center">
              <ShoppingBag className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {vendorsData.reduce((sum, v) => sum + v.totalProducts, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Products</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 bg-gray-50/50">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {vendorsData.reduce((sum, v) => sum + v.totalSales, 0).toLocaleString()}+
              </div>
              <div className="text-sm text-gray-600">Total Sales</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


