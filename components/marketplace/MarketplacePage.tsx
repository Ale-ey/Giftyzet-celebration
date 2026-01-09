"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Star, Gift, ShoppingCart, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { STORE_CATEGORIES } from "@/lib/constants"
import { getApprovedProducts } from "@/lib/api/products"

const categories = [
  { name: "All Categories", value: "all" },
  ...STORE_CATEGORIES.map((cat) => ({ name: cat, value: cat }))
]

export default function MarketplacePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getApprovedProducts()
      console.log("Products data:", data)
      if (data && data.length > 0) {
        console.log("First product stores:", data[0].stores)
      }
      setProducts(data || [])
    } catch (error) {
      console.error("Error loading products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const vendorName = product.stores?.vendors?.vendor_name || ""
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = 
        selectedCategory === "all" || product.category === selectedCategory
      
      return matchesSearch && matchesCategory && product.available !== false
    })
  }, [products, searchQuery, selectedCategory])

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: `$${product.price}`,
      image: product.image_url,
      quantity: 1,
      type: "product",
      vendor: product.stores?.vendors?.vendor_name || product.stores?.name || "Unknown Vendor"
    }
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === product.id && item.type === "product")
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    window.dispatchEvent(new Event("cartUpdated"))
    alert(`Added ${product.name} to cart!`)
  }

  const handleBuyNow = (product: any) => {
    handleAddToCart(product)
    router.push("/cart")
  }

  const handleGiftNow = (product: any) => {
    handleAddToCart(product)
    router.push("/send-gift")
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Search */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Marketplace</h1>
          <p className="text-gray-600 mb-6">
            Discover thousands of products from verified vendors
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
          {/* Categories Sidebar */}
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
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600">
                  {searchQuery || selectedCategory !== "all" 
                    ? "Try adjusting your search or filters"
                    : "No products available at the moment"}
              </p>
            </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className="group border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      <div className="aspect-square overflow-hidden bg-gray-100 relative">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Package className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                        {product.original_price && product.price < product.original_price && (
                          <Badge className="absolute top-2 right-2 bg-red-500 text-white border-0">
                            {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            by {product.stores?.vendors?.vendor_name || product.stores?.name || "Unknown Vendor"}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 mb-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(product.rating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">
                            ({product.reviews_count || 0})
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-xl font-bold text-primary">
                            ${product.price}
                          </span>
                          {product.original_price && product.price < product.original_price && (
                            <span className="text-sm text-gray-400 line-through">
                              ${product.original_price}
                            </span>
                          )}
                        </div>

                        <Badge variant="outline" className="mb-3 text-xs border-gray-200 text-gray-600">
                          {product.category}
                        </Badge>

                        <div className="flex gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCart(product)
                            }}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGiftNow(product)
                            }}
                            size="sm"
                            className="flex-1 bg-primary hover:bg-primary/90 text-white"
                          >
                            <Gift className="h-3 w-3 mr-1" />
                            Gift
                          </Button>
                        </div>
                </CardContent>
              </Card>
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
