"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Gift, Package } from "lucide-react"
import { getApprovedProducts } from "@/lib/api/products"

export default function MarketplacePreview() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getApprovedProducts(8) // Load 8 featured products
      setProducts(data || [])
    } catch (error) {
      console.error("Error loading products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (product: any) => {
    router.push(`/product/${product.id}`)
  }

  const handleBuyNow = (e: React.MouseEvent, product: any) => {
    e.stopPropagation()
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: `$${product.price}`,
      image: product.image_url,
      quantity: 1,
      type: "product",
      vendor: product.stores?.vendors?.vendor_name || "Unknown Vendor"
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
    router.push(`/product/${product.id}`)
  }

  const handleGiftNow = (e: React.MouseEvent, product: any) => {
    e.stopPropagation()
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: `$${product.price}`,
      image: product.image_url,
      quantity: 1,
      type: "product",
      vendor: product.stores?.vendors?.vendor_name || "Unknown Vendor"
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
    router.push("/send-gift")
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
            From electronics to wellness, from local artisans to global brands. 
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
            <Badge variant="secondary" className="text-sm py-2 px-4">
              ✈️ Travel & Leisure
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Available</h3>
            <p className="text-gray-600 mb-6">
              Check back soon for amazing products!
            </p>
            <Button
              onClick={() => router.push("/marketplace")}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Explore Marketplace
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer overflow-hidden border border-gray-200 bg-white hover:shadow-xl transition-all duration-300"
                  onClick={() => handleCardClick(product)}
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
                      <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0">
                        {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        by {product.stores?.vendors?.vendor_name || "Unknown"}
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
                      <span className="text-2xl font-bold text-primary">
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

                    <div className="space-y-2">
                      <Button
                        onClick={(e) => handleBuyNow(e, product)}
                        className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                        size="sm"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={(e) => handleGiftNow(e, product)}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        size="sm"
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Send as Gift
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={() => router.push("/marketplace")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
              >
                Explore Full Marketplace
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
