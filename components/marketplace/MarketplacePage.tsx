"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Gift } from "lucide-react"
import { allProducts, STORE_CATEGORIES } from "@/lib/constants"
import type { Product } from "@/types"

const categories = [
  { name: "All Categories", value: "all" },
  ...STORE_CATEGORIES.map((cat) => ({ name: cat, value: cat }))
]

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = 
        selectedCategory === "all" || product.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Search */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Marketplace</h1>
          <p className="text-gray-600 mb-6">
            Discover thousands of products and services from leading brands
          </p>
          
          {/* Search Bar - Centered */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search products, vendors, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-6 text-base bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            className="md:hidden mt-4 w-full"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {isMobileMenuOpen ? "Hide" : "Show"} Categories
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar - Minimal */}
          <aside className={`lg:w-56 flex-shrink-0 ${isMobileMenuOpen ? "block" : "hidden md:block"}`}>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Categories</h2>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => {
                      setSelectedCategory(category.value)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                      selectedCategory === category.value
                        ? "bg-primary text-white font-medium"
                        : "text-gray-600 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <Card className="border border-gray-200 bg-white">
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
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  
  const handleCardClick = () => {
    router.push(`/product/${product.id}`)
  }
  
  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    
    // Add product to cart
    const cartItem = {
      ...product,
      quantity: 1
    }
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    
    // Check if product already exists in cart
    const existingItemIndex = existingCart.findIndex((item: Product & { quantity: number }) => item.id === product.id)
    
    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      existingCart[existingItemIndex].quantity += 1
    } else {
      // Add new item to cart
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    
    // Dispatch event to update cart count in header
    window.dispatchEvent(new Event("cartUpdated"))
    
    // Navigate to product detail page
    router.push(`/product/${product.id}`)
  }
  
  const handleGiftNow = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    
    // Add product to cart first
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
    
    // Navigate to gift page
    router.push(`/send-gift?product=${encodeURIComponent(JSON.stringify(product))}`)
  }

  return (
    <Card 
      className="group hover:shadow-xl border-2 border-gray-100 hover:border-primary/20 transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-white cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        <Badge className="absolute top-2 left-2 bg-secondary text-gray-900 font-semibold shadow-md">
          {product.discount}
        </Badge>
        <Button
          size="sm"
          className="absolute top-2 right-2 bg-white/90 text-primary hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleGiftNow}
        >
          <Gift className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
            {product.category}
          </Badge>
          <div className="flex items-center text-xs text-gray-600 font-medium">
            <Star className="h-3.5 w-3.5 fill-current text-yellow-500 mr-1" />
            {product.rating} ({product.reviews})
          </div>
        </div>
        
        <h3 className="font-bold text-base mb-2 line-clamp-2 text-gray-900 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <div className="text-sm text-gray-600 mb-4 font-medium">
          by {product.vendor}
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <span className="font-bold text-lg text-primary">{product.price}</span>
          <span className="text-sm text-gray-500 line-through">
            {product.originalPrice}
          </span>
        </div>
        
        <Button 
          size="sm" 
          variant="outline"
          className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-red-600 hover:text-white hover:border-red-600 font-semibold"
          onClick={handleGiftNow}
        >
          Send Gift
        </Button>
      </CardContent>
    </Card>
  )
}

