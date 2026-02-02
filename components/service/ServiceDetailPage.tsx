"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Gift, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getService } from "@/lib/api/products"
import { getReviewsForService } from "@/lib/api/reviews"
import { useToast } from "@/components/ui/toast"

function ServiceReviews({ serviceId }: { serviceId: string }) {
  const [reviews, setReviews] = useState<Array<{ id: string; rating: number; comment: string | null; created_at: string; users: { name: string | null } | null }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReviewsForService(serviceId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [serviceId])

  if (loading) return <div className="text-sm text-gray-500 mt-4">Loading reviews...</div>
  if (reviews.length === 0) return <div className="text-sm text-gray-500 mt-4">No reviews yet.</div>

  return (
    <Card className="border border-gray-200 bg-gray-50/50 mt-6">
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Customer Reviews</h3>
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-4 w-4 ${star <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">{r.users?.name ?? 'Customer'}</span>
                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ServiceDetailPage({ serviceId }: { serviceId: string }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [hours, setHours] = useState(1)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="border-2 border-gray-200 bg-white">
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

  const pricePerHour = typeof service.price === 'number' ? service.price : parseFloat(String(service.price)) || 0

  const handleAddToCart = () => {
    const cartItem = {
      id: service.id,
      name: service.name,
      price: pricePerHour,
      image: service.image_url,
      store_id: service.store_id,
      category: service.category,
      type: 'service' as const,
      location: service.location,
      quantity: hours
    }
    
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === service.id && item.type === 'service')
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += hours
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    window.dispatchEvent(new Event("cartUpdated"))
    showToast(`Added ${hours} ${hours === 1 ? 'hour' : 'hours'} to cart!`, "success")
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
                {serviceImages.map((image: string, index: number) => (
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
              <h1 className="text-4xl font-semibold text-gray-800 mb-3">{service.name}</h1>

              {/* Average rating under title */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= (service.rating ?? 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {Number(service.rating ?? 0).toFixed(1)} · {(service.reviews_count ?? 0)} reviews
                </span>
              </div>

              {/* Service Specific Info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-sm font-medium">${pricePerHour.toFixed(2)} per hour</span>
                </div>
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
              <div className="flex items-baseline flex-wrap gap-2">
                <span className="text-4xl font-semibold text-primary">${pricePerHour.toFixed(2)}</span>
                <span className="text-lg text-gray-600">per hour</span>
                {service.original_price != null && service.original_price > pricePerHour && (
                  <>
                    <span className="text-xl text-gray-400 line-through">${Number(service.original_price).toFixed(2)}/hr</span>
                    <Badge className="bg-red-500 text-white">
                      {Math.round((1 - pricePerHour / Number(service.original_price)) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Total for {hours} {hours === 1 ? 'hour' : 'hours'}: <span className="font-semibold text-gray-900">${(pricePerHour * hours).toFixed(2)}</span>
              </p>
            </div>

            {/* Hours Selector */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">How many hours?</label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHours(Math.max(1, hours - 1))}
                    className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  >
                    -
                  </Button>
                  <span className="text-lg font-medium text-gray-700 w-12 text-center">{hours}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHours(hours + 1)}
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
                    <span className="text-gray-500">Price</span>
                    <span className="font-medium text-gray-700">${pricePerHour.toFixed(2)} per hour</span>
                  </div>
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

            {/* Reviews */}
            <ServiceReviews serviceId={service.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

