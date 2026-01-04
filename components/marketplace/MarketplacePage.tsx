"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Gift } from "lucide-react"
import { featuredProducts } from "@/lib/constants"
import type { Product } from "@/types"

// Extended products list (in production, this would come from an API)
const allProducts: Product[] = [
  ...featuredProducts,
  {
    id: 5,
    name: "Wireless Headphones",
    price: "$79.99",
    originalPrice: "$99.99",
    rating: 4.5,
    reviews: 892,
    category: "Electronics",
    vendor: "TechBrand",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
    discount: "20% OFF"
  },
  {
    id: 6,
    name: "Facial Treatment",
    price: "$89.99",
    originalPrice: "$120.00",
    rating: 4.7,
    reviews: 456,
    category: "Beauty & Wellness",
    vendor: "Glow Spa",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop",
    discount: "25% OFF"
  },
  {
    id: 7,
    name: "Gourmet Dinner for Two",
    price: "$149.99",
    originalPrice: "$199.99",
    rating: 4.9,
    reviews: 1234,
    category: "Food & Experiences",
    vendor: "Fine Dining Co",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop",
    discount: "Limited Time"
  },
  {
    id: 8,
    name: "Home Organization Service",
    price: "$199.99",
    originalPrice: "$249.99",
    rating: 4.6,
    reviews: 678,
    category: "Home Services",
    vendor: "OrganizePro",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
    discount: "First Time"
  },
  {
    id: 9,
    name: "Handmade Ceramic Set",
    price: "$59.99",
    originalPrice: "$79.99",
    rating: 4.8,
    reviews: 345,
    category: "Local Artisans",
    vendor: "Artisan Crafts",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68581?w=300&h=300&fit=crop",
    discount: "25% OFF"
  },
  {
    id: 10,
    name: "Smart Watch",
    price: "$299.99",
    originalPrice: "$349.99",
    rating: 4.6,
    reviews: 2134,
    category: "Electronics",
    vendor: "TechBrand",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
    discount: "14% OFF"
  },
  {
    id: 11,
    name: "Yoga Class Package",
    price: "$99.99",
    originalPrice: "$129.99",
    rating: 4.7,
    reviews: 567,
    category: "Beauty & Wellness",
    vendor: "Zen Studio",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop",
    discount: "23% OFF"
  },
  {
    id: 12,
    name: "Cooking Class Experience",
    price: "$119.99",
    originalPrice: "$149.99",
    rating: 4.8,
    reviews: 789,
    category: "Food & Experiences",
    vendor: "Culinary Academy",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop",
    discount: "20% OFF"
  }
]

const categories = [
  { name: "All Categories", value: "all" },
  { name: "Electronics", value: "Electronics" },
  { name: "Beauty & Wellness", value: "Beauty & Wellness" },
  { name: "Food & Experiences", value: "Food & Experiences" },
  { name: "Home Services", value: "Home Services" },
  { name: "Local Artisans", value: "Local Artisans" },
  { name: "Experiences", value: "Experiences" },
  { name: "Services", value: "Services" }
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
  
  const handleGiftNow = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
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
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
          onClick={handleGiftNow}
        >
          Gift Now
        </Button>
      </CardContent>
    </Card>
  )
}

