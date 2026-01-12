"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Gift, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getService } from "@/lib/api/products"
import { useToast } from "@/components/ui/toast"

export default function ServiceDetailPage({ serviceId }: { serviceId: string }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchService() {
      try {
        setLoading(true)
        const data = await getService(serviceId)
        setService(data)
      } catch (err: any) {
        console.error('Error fetching service:', err)
        setError(err.message || 'Failed to load service')
      } finally {
        setLoading(false)
      }
    }

    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  // Get service images from the images array or fallback to image_url
  const serviceImages = service?.images && service.images.length > 0 
    ? service.images 
    : service?.image_url 
    ? [service.image_url] 
    : []

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="border-2 border-gray-100">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 text-lg">Loading service...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="border-2 border-gray-100">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">{error || 'Service not found'}</p>
            <Button 
              variant="outline"
              className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
              onClick={() => router.push("/services")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleAddToCart = () => {
    const cartItem = {
      id: service.id,
      name: service.name,
      price: typeof service.price === 'number' ? `$${service.price}` : service.price,
      image: service.image_url,
      store_id: service.store_id,
      type: 'service',
      duration: service.duration,
      location: service.location,
      quantity
    }
    
    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    
    // Check if service already exists in cart
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === service.id && item.type === 'service')
    
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
    showToast(`Added ${quantity} ${quantity > 1 ? 'services' : 'service'} to cart!`, "success")
  }

  const handleSendGift = () => {
    // Add service to cart first
    handleAddToCart()
    
    // Navigate to gift page
    router.push(`/send-gift?serviceId=${service.id}&type=service`)
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
          {/* Service Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
              {serviceImages.length > 0 ? (
                <>
                  <img
                    src={serviceImages[selectedImageIndex]}
                    alt={service.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  {service.original_price && service.original_price > service.price && (
                    <Badge className="absolute top-4 left-4 bg-red-500 text-white font-semibold shadow-md">
                      {Math.round((1 - service.price / service.original_price) * 100)}% OFF
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
            {serviceImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {serviceImages.map((image, index) => (
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
                      alt={`${service.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-3 border-gray-200 bg-white text-gray-600">
                {service.category}
              </Badge>
              <h1 className="text-4xl font-semibold text-gray-800 mb-4">{service.name}</h1>
              
              <p className="text-gray-500 mb-4">
                by <span className="font-medium text-gray-700">
                  {service.stores?.vendors?.vendor_name || service.stores?.name || 'Unknown Vendor'}
                </span>
              </p>

              {/* Service Specific Info */}
              <div className="flex items-center gap-4 mb-4">
                {service.duration && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">{service.duration}</span>
                  </div>
                )}
                {service.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">{service.location}</span>
                  </div>
                )}
              </div>
              
              {/* Service Description */}
              {service.description && (
                <div className="mb-6">
                  <p className="text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="border-t border-b border-gray-200 py-6 bg-gray-50/30">
              <div className="flex items-baseline space-x-4">
                <span className="text-4xl font-semibold text-primary">${service.price.toFixed(2)}</span>
                {service.original_price && service.original_price > service.price && (
                  <>
                    <span className="text-xl text-gray-400 line-through">${service.original_price.toFixed(2)}</span>
                    <Badge className="bg-red-500 text-white">
                      {Math.round((1 - service.price / service.original_price) * 100)}% OFF
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

            {/* Service Info */}
            <Card className="border border-gray-200 bg-gray-50/50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Service Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-gray-700">{service.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Store</span>
                    <span className="font-medium text-gray-700">{service.stores?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vendor</span>
                    <span className="font-medium text-gray-700">
                      {service.stores?.vendors?.vendor_name || 'N/A'}
                    </span>
                  </div>
                  {service.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium text-gray-700">{service.duration}</span>
                    </div>
                  )}
                  {service.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location</span>
                      <span className="font-medium text-gray-700">{service.location}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Availability</span>
                    <span className="font-medium text-gray-700">
                      {service.available ? 'Available' : 'Not Available'}
                    </span>
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

