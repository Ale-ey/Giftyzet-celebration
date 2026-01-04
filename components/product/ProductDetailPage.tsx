"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { featuredProducts } from "@/lib/constants"
import type { Product } from "@/types"

// Extended products list (same as in MarketplacePage)
const extendedProducts: Product[] = [
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

// Combine all products for lookup
const allProductsList: Product[] = [
  ...featuredProducts,
  ...extendedProducts
]

export default function ProductDetailPage({ productId }: { productId: string }) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  
  // Find product by ID
  const product = allProductsList.find((p) => p.id === parseInt(productId))

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="border-2 border-gray-100">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">Product not found</p>
            <Button onClick={() => router.push("/marketplace")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleAddToCart = () => {
    // In a real app, this would add to cart state/context
    const cartItem = {
      ...product,
      quantity
    }
    // Store in localStorage for now
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const updatedCart = [...existingCart, cartItem]
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    
    // Dispatch event to update cart count in header
    window.dispatchEvent(new Event("cartUpdated"))
    
    // Show success message (in real app, use toast)
    alert("Added to cart!")
  }

  const handleGiftNow = () => {
    router.push(`/send-gift?product=${encodeURIComponent(JSON.stringify(product))}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <Badge className="absolute top-4 left-4 bg-secondary text-gray-900 font-semibold shadow-md">
                {product.discount}
              </Badge>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-3 border-gray-300 text-gray-700">
                {product.category}
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 mr-1" />
                  <span className="font-semibold text-gray-900">{product.rating}</span>
                  <span className="text-gray-600 ml-2">({product.reviews} reviews)</span>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                by <span className="font-semibold text-gray-900">{product.vendor}</span>
              </p>
            </div>

            {/* Price */}
            <div className="border-t border-b border-gray-200 py-6">
              <div className="flex items-baseline space-x-4">
                <span className="text-4xl font-bold text-primary">{product.price}</span>
                <span className="text-xl text-gray-500 line-through">{product.originalPrice}</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">Quantity</label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="border-gray-300"
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold text-gray-900 w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="border-gray-300"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 border-2 border-primary text-primary hover:bg-primary/10"
                  onClick={handleGiftNow}
                >
                  <Gift className="h-5 w-5 mr-2" />
                  Gift Now
                </Button>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-50"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Wishlist
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Product Info */}
            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Product Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-semibold text-gray-900">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor</span>
                    <span className="font-semibold text-gray-900">{product.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-semibold text-gray-900">{product.rating} / 5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviews</span>
                    <span className="font-semibold text-gray-900">{product.reviews}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

