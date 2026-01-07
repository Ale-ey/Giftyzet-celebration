"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ExternalLink, Gift } from "lucide-react"
import { featuredProducts } from "@/lib/constants"
import type { Product } from "@/types"

export default function MarketplacePreview() {
  const router = useRouter()

  const handleCardClick = (product: Product) => {
    router.push(`/product/${product.id}`)
  }

  const handleBuyNow = (e: React.MouseEvent, product: Product) => {
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

  const handleGiftNow = (e: React.MouseEvent, product: Product) => {
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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            <span className="text-primary">
              Everything
            </span> They Could Want
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            From Samsung phones to spa days, from local artisans to global brands. 
            Our marketplace has thousands of products and services ready to gift.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Badge variant="secondary" className="text-sm py-2 px-4">
              📱 Electronics
            </Badge>
            <Badge variant="secondary" className="text-sm py-2 px-4">
              🌸 Beauty & Wellness
            </Badge>
            <Badge variant="secondary" className="text-sm py-2 px-4">
              🍽️ Food & Experiences
            </Badge>
            <Badge variant="secondary" className="text-sm py-2 px-4">
              🏠 Home Services
            </Badge>
            <Badge variant="secondary" className="text-sm py-2 px-4">
              🎨 Local Artisans
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featuredProducts.map((product, index) => (
            <Card 
              key={product.id} 
              className="group hover:shadow-xl border-2 border-gray-100 hover:border-primary/20 transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-white cursor-pointer"
              onClick={() => handleCardClick(product)}
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
                  onClick={(e) => handleGiftNow(e, product)}
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
                  onClick={(e) => handleGiftNow(e, product)}
                >
                  Send Gift
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Vendor Partners */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-8 text-gray-900">
            Trusted by Leading Brands & Local Businesses
          </h3>
          
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="text-lg font-semibold text-gray-700">Samsung</div>
            <div className="text-lg font-semibold text-gray-700">Best Buy</div>
            <div className="text-lg font-semibold text-gray-700">Macy's</div>
            <div className="text-lg font-semibold text-gray-700">Sephora</div>
            <div className="text-lg font-semibold text-gray-700">1-800-Flowers</div>
            <div className="text-lg font-semibold text-primary">+ 5,000 more</div>
          </div>
          
          <Button 
            className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-8 py-3"
            size="lg"
            onClick={() => router.push('/marketplace')}
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Explore Full Marketplace
          </Button>
        </div>
      </div>
    </section>
  )
}
