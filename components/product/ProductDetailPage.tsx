"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getProduct } from "@/lib/api/products"
import { useToast } from "@/components/ui/toast"

export default function ProductDetailPage({ productId }: { productId: string }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const data = await getProduct(productId)
        setProduct(data)
      } catch (err: any) {
        console.error('Error fetching product:', err)
        setError(err.message || 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  // Get product images from the images array or fallback to image_url
  const productImages = product?.images && product.images.length > 0 
    ? product.images 
    : product?.image_url 
    ? [product.image_url] 
    : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="border-2 border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 text-lg">Loading product...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="border-2 border-gray-100">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">{error || 'Product not found'}</p>
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
    const cartItem = {
      id: product.id,
      name: product.name,
      price: typeof product.price === 'number' ? `$${product.price}` : product.price,
      image: product.image_url,
      store_id: product.store_id,
      type: 'product',
      quantity
    }
    
    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    
    // Check if product already exists in cart
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === product.id && item.type === 'product')
    
    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      existingCart[existingItemIndex].quantity += quantity
    } else {
      // Add new item to cart
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    
    // Dispatch event to update cart count in header
    window.dispatchEvent(new Event("cartUpdated"))
    
    // Show success message
    showToast(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart!`, "success")
  }

  const handleSendGift = () => {
    // Add product to cart first
    handleAddToCart()
    
    // Navigate to gift page
    router.push(`/send-gift?productId=${product.id}&type=product`)
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
          {/* Product Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
              {productImages.length > 0 ? (
                <>
                  <img
                    src={productImages[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  {product.original_price && product.original_price > product.price && (
                    <Badge className="absolute top-4 left-4 bg-red-500 text-white font-semibold shadow-md">
                      {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                    </Badge>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>
            
            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {productImages.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-200 hover:border-gray-300"
                    } bg-gray-50`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-3 border-gray-200 bg-white text-gray-600">
                {product.category}
              </Badge>
              <h1 className="text-4xl font-semibold text-gray-800 mb-4">{product.name}</h1>
              
              <p className="text-gray-500 mb-4">
                by <span className="font-medium text-gray-700">
                  {product.stores?.vendors?.vendor_name || product.stores?.name || 'Unknown Vendor'}
                </span>
              </p>
              
              {/* Product Description */}
              {product.description && (
                <div className="mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="border-t border-b border-gray-200 py-6 bg-gray-50/30">
              <div className="flex items-baseline space-x-4">
                <span className="text-4xl font-semibold text-primary">${product.price.toFixed(2)}</span>
                {product.original_price && product.original_price > product.price && (
                  <>
                    <span className="text-xl text-gray-400 line-through">${product.original_price.toFixed(2)}</span>
                    <Badge className="bg-red-500 text-white">
                      {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Quantity</label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  >
                    -
                  </Button>
                  <span className="text-lg font-medium text-gray-700 w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                  onClick={handleSendGift}
                >
                  <Gift className="h-5 w-5 mr-2" />
                  Send Gift
                </Button>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium"
                  onClick={() => router.push("/wishlist")}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Wishlist
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Product Info */}
            <Card className="border border-gray-200 bg-gray-50/50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Product Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-gray-700">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Store</span>
                    <span className="font-medium text-gray-700">{product.stores?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vendor</span>
                    <span className="font-medium text-gray-700">
                      {product.stores?.vendors?.vendor_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Availability</span>
                    <span className="font-medium text-gray-700">
                      {product.available ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  {product.stock && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stock</span>
                      <span className="font-medium text-gray-700">{product.stock} units</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

