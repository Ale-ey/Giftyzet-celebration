"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Store, Star, ShoppingCart, Gift, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { allProducts } from "@/lib/constants"
import type { Product } from "@/types"

interface VendorStorePageProps {
  vendorName: string
}

export default function VendorStorePage({ vendorName }: VendorStorePageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Get vendor products
  const vendorProducts = useMemo(() => {
    return allProducts.filter(product => product.vendor === vendorName)
  }, [vendorName])

  // Calculate vendor stats
  const vendorStats = useMemo(() => {
    if (vendorProducts.length === 0) return null

    const avgRating = vendorProducts.reduce((sum, p) => sum + p.rating, 0) / vendorProducts.length
    const totalReviews = vendorProducts.reduce((sum, p) => sum + p.reviews, 0)
    const categories = [...new Set(vendorProducts.map(p => p.category))]
    const totalSales = Math.floor(Math.random() * 5000) + 1000

    return {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews,
      totalProducts: vendorProducts.length,
      totalSales,
      categories,
      verified: true
    }
  }, [vendorProducts])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(vendorProducts.map(p => p.category))]
    return [
      { name: "All Categories", value: "all" },
      ...cats.map(cat => ({ name: cat, value: cat }))
    ]
  }, [vendorProducts])

  // Filter products
  const filteredProducts = useMemo(() => {
    return vendorProducts.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = 
        selectedCategory === "all" || product.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [vendorProducts, searchQuery, selectedCategory])

  const handleAddToCart = (product: Product) => {
    const cartItem = {
      ...product,
      quantity: 1
    }
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItemIndex = existingCart.findIndex((item: Product & { quantity: number }) => item.id === product.id)
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    window.dispatchEvent(new Event("cartUpdated"))
    alert(`Added ${product.name} to cart!`)
  }

  const handleBuyNow = (product: Product) => {
    handleAddToCart(product)
    router.push(`/product/${product.id}`)
  }

  const handleGiftNow = (product: Product) => {
    handleAddToCart(product)
    router.push(`/send-gift?product=${encodeURIComponent(JSON.stringify(product))}`)
  }

  if (!vendorStats) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="border-2 border-gray-100">
          <CardContent className="p-12 text-center">
            <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">Vendor not found</p>
            <Button
              variant="outline"
              className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
              onClick={() => router.push("/vendors")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/vendors")}
          className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </Button>

        {/* Vendor Header */}
        <Card className="border-2 border-gray-100 bg-white mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{vendorName}</h1>
                    {vendorStats.verified && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600">
                    {vendorStats.categories.join(", ")} • {vendorStats.totalProducts} Products
                  </p>
                </div>
              </div>

              {/* Vendor Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-xl font-bold text-gray-900">{vendorStats.rating}</span>
                  </div>
                  <p className="text-xs text-gray-600">{vendorStats.totalReviews} reviews</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {vendorStats.totalProducts}
                  </div>
                  <p className="text-xs text-gray-600">Products</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {vendorStats.totalSales}+
                  </div>
                  <p className="text-xs text-gray-600">Sales</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-6 text-base bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
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

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="border-2 border-gray-100">
            <CardContent className="p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">No products found</p>
              <p className="text-gray-500 text-sm">
                Try adjusting your search or category filter
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group hover:shadow-xl border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-white"
              >
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300 cursor-pointer"
                    onClick={() => router.push(`/product/${product.id}`)}
                    loading="lazy"
                    decoding="async"
                  />
                  <Badge className="absolute top-2 left-2 bg-secondary text-gray-900 font-semibold shadow-md">
                    {product.discount}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-white/90 border-gray-200 text-gray-700 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleGiftNow(product)
                    }}
                  >
                    <Gift className="h-4 w-4" />
                  </Button>
                </div>

                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="text-xs border-gray-200 bg-white text-gray-600">
                      {product.category}
                    </Badge>
                    <div className="flex items-center text-xs text-gray-600 font-medium">
                      <Star className="h-3.5 w-3.5 fill-current text-yellow-500 mr-1" />
                      {product.rating} ({product.reviews})
                    </div>
                  </div>

                  <h3
                    className="font-bold text-base mb-2 line-clamp-2 text-gray-900 group-hover:text-primary transition-colors cursor-pointer"
                    onClick={() => router.push(`/product/${product.id}`)}
                  >
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-2 mb-4">
                    <span className="font-bold text-lg text-primary">{product.price}</span>
                    <span className="text-sm text-gray-500 line-through">
                      {product.originalPrice}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-red-600 hover:text-white hover:border-red-600 font-medium"
                      onClick={() => handleGiftNow(product)}
                    >
                      <Gift className="h-4 w-4 mr-1" />
                      Send Gift
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


