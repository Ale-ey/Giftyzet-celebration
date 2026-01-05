"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Gift, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { allServices, getServiceById } from "@/lib/constants"
import type { Service } from "@/types"

export default function ServiceDetailPage({ serviceId }: { serviceId: string }) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // Find service by ID using centralized data
  const serviceIdNum = serviceId ? parseInt(serviceId) : NaN
  const service = !isNaN(serviceIdNum) ? getServiceById(serviceIdNum) : undefined

  // Generate image gallery - main image + 4 variations/angles
  const serviceImages = service ? [
    service.image,
    service.image.replace('?w=300&h=300&fit=crop', '?w=600&h=600&fit=crop'),
    service.image.replace('?w=300&h=300&fit=crop', '?w=600&h=600&fit=crop&q=80'),
    service.image.replace('?w=300&h=300&fit=crop', '?w=600&h=600&fit=crop&q=90'),
    service.image.replace('?w=300&h=300&fit=crop', '?w=600&h=600&fit=crop&q=85'),
  ] : []

  if (!service) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="border-2 border-gray-100">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">Service not found</p>
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
      ...service,
      quantity
    }
    
    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    
    // Check if service already exists in cart
    const existingItemIndex = existingCart.findIndex((item: Service & { quantity: number }) => item.id === service.id)
    
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
    
    // Show success message (in real app, use toast)
    alert(`Added ${quantity} service(s) to cart!`)
  }

  const handleSendGift = () => {
    // Add service to cart first
    const cartItem = {
      ...service,
      quantity
    }
    
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItemIndex = existingCart.findIndex((item: Service & { quantity: number }) => item.id === service.id)
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += quantity
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    window.dispatchEvent(new Event("cartUpdated"))
    
    // Navigate to gift page
    router.push(`/send-gift?service=${encodeURIComponent(JSON.stringify(service))}`)
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
              <img
                src={serviceImages[selectedImageIndex]}
                alt={service.name}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <Badge className="absolute top-4 left-4 bg-secondary text-gray-900 font-semibold shadow-md">
                {service.discount}
              </Badge>
            </div>
            
            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-3">
              {serviceImages.slice(0, 4).map((image, index) => (
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
          </div>

          {/* Service Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-3 border-gray-200 bg-white text-gray-600">
                {service.category}
              </Badge>
              <h1 className="text-4xl font-semibold text-gray-800 mb-4">{service.name}</h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-medium text-gray-700">{service.rating}</span>
                  <span className="text-gray-500 ml-2">({service.reviews} reviews)</span>
                </div>
              </div>

              <p className="text-gray-500 mb-4">
                by <span className="font-medium text-gray-700">{service.vendor}</span>
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
                <span className="text-4xl font-semibold text-primary">{service.price}</span>
                <span className="text-xl text-gray-400 line-through">{service.originalPrice}</span>
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
                    <span className="text-gray-500">Vendor</span>
                    <span className="font-medium text-gray-700">{service.vendor}</span>
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
                    <span className="text-gray-500">Rating</span>
                    <span className="font-medium text-gray-700">{service.rating} / 5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reviews</span>
                    <span className="font-medium text-gray-700">{service.reviews}</span>
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

