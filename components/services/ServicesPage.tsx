"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Star, Clock, MapPin, ShoppingCart, Gift } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { allServices, STORE_CATEGORIES } from "@/lib/constants"
import type { Service } from "@/types"

const categories = [
  { name: "All Categories", value: "all" },
  ...STORE_CATEGORIES.map((cat) => ({ name: cat, value: cat }))
]

export default function ServicesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const filteredServices = useMemo(() => {
    return allServices.filter((service) => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = 
        selectedCategory === "all" || service.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const handleAddToCart = (service: Service) => {
    const cartItem = {
      ...service,
      quantity: 1
    }
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItemIndex = existingCart.findIndex((item: Service & { quantity: number }) => item.id === service.id)
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    window.dispatchEvent(new Event("cartUpdated"))
    alert(`Added ${service.name} to cart!`)
  }

  const handleBuyNow = (service: Service) => {
    handleAddToCart(service)
    router.push(`/service/${service.id}`)
  }

  const handleGiftNow = (service: Service) => {
    handleAddToCart(service)
    router.push(`/send-gift?service=${encodeURIComponent(JSON.stringify(service))}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Search */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Services</h1>
          <p className="text-gray-600 mb-6">
            Book professional services and experiences as gifts
          </p>
          
          {/* Search Bar - Centered */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search services, vendors, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-6 text-base bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            className="md:hidden mt-4 w-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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

          {/* Services Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredServices.length}</span> services
              </p>
            </div>

            {filteredServices.length === 0 ? (
              <Card className="border-2 border-gray-100">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-600 text-lg mb-2">No services found</p>
                  <p className="text-gray-500 text-sm">
                    Try adjusting your search or category filter
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} onBuyNow={handleBuyNow} onGiftNow={handleGiftNow} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ServiceCard({ 
  service, 
  onBuyNow, 
  onGiftNow 
}: { 
  service: Service
  onBuyNow: (service: Service) => void
  onGiftNow: (service: Service) => void
}) {
  const router = useRouter()
  
  const handleCardClick = () => {
    router.push(`/service/${service.id}`)
  }
  
  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    onBuyNow(service)
  }

  const handleGiftNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    onGiftNow(service)
  }

  return (
    <Card 
      className="group hover:shadow-xl border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-white cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img 
          src={service.image} 
          alt={service.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        <Badge className="absolute top-2 left-2 bg-secondary text-gray-900 font-semibold shadow-md">
          {service.discount}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="absolute top-2 right-2 bg-white/90 border-gray-200 text-gray-700 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleGiftNow}
        >
          <Gift className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className="text-xs border-gray-200 bg-white text-gray-600">
            {service.category}
          </Badge>
          <div className="flex items-center text-xs text-gray-600 font-medium">
            <Star className="h-3.5 w-3.5 fill-current text-yellow-500 mr-1" />
            {service.rating} ({service.reviews})
          </div>
        </div>
        
        <h3 className="font-bold text-base mb-2 line-clamp-2 text-gray-900 group-hover:text-primary transition-colors">
          {service.name}
        </h3>
        
        <div className="text-sm text-gray-600 mb-3 font-medium">
          by {service.vendor}
        </div>

        {service.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Service Details */}
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
          {service.duration && (
            <div className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {service.duration}
            </div>
          )}
          {service.location && (
            <div className="flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              {service.location}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <span className="font-bold text-lg text-primary">{service.price}</span>
          <span className="text-sm text-gray-500 line-through">
            {service.originalPrice}
          </span>
        </div>
        
        <Button 
          size="sm" 
          variant="outline"
          className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold"
          onClick={handleBuyNow}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Book Now
        </Button>
      </CardContent>
    </Card>
  )
}

