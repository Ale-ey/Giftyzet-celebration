"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Star, Clock, MapPin, ShoppingCart, Gift, Wrench } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { STORE_CATEGORIES } from "@/lib/constants"
import { getApprovedServices } from "@/lib/api/products"

const categories = [
  { name: "All Categories", value: "all" },
  ...STORE_CATEGORIES.map((cat) => ({ name: cat, value: cat }))
]

export default function ServicesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const data = await getApprovedServices()
      console.log("Services data:", data)
      if (data && data.length > 0) {
        console.log("First service stores:", data[0].stores)
      }
      setServices(data || [])
    } catch (error) {
      console.error("Error loading services:", error)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const vendorName = service.stores?.vendors?.vendor_name || ""
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = 
        selectedCategory === "all" || service.category === selectedCategory
      
      return matchesSearch && matchesCategory && service.available !== false
    })
  }, [services, searchQuery, selectedCategory])

  const handleAddToCart = (service: any) => {
    const cartItem = {
      id: service.id,
      name: service.name,
      price: `$${service.price}`,
      image: service.image_url,
      quantity: 1,
      type: "service",
      vendor: service.stores?.vendors?.vendor_name || service.stores?.name || "Unknown Vendor"
    }
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === service.id && item.type === "service")
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    window.dispatchEvent(new Event("cartUpdated"))
    alert(`Added ${service.name} to cart!`)
  }

  const handleBuyNow = (service: any) => {
    handleAddToCart(service)
    router.push("/cart")
  }

  const handleGiftNow = (service: any) => {
    handleAddToCart(service)
    router.push("/send-gift")
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
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading services...</p>
                </div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-20">
                <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Found</h3>
                <p className="text-gray-600">
                  {searchQuery || selectedCategory !== "all" 
                    ? "Try adjusting your search or filters"
                    : "No services available at the moment"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Showing {filteredServices.length} {filteredServices.length === 1 ? "service" : "services"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <Card 
                      key={service.id} 
                      className="group border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => router.push(`/service/${service.id}`)}
                    >
                      <div className="aspect-video overflow-hidden bg-gray-100 relative">
                        {service.image_url ? (
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Wrench className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                        {service.original_price && service.price < service.original_price && (
                          <Badge className="absolute top-2 right-2 bg-red-500 text-white border-0">
                            {Math.round(((service.original_price - service.price) / service.original_price) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            by {service.stores?.vendors?.vendor_name || service.stores?.name || "Unknown Vendor"}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= Math.round(Number(service.rating) || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">
                            {Number(service.rating ?? 0).toFixed(1)} ({(service.reviews_count ?? 0)} reviews)
                          </span>
                        </div>

                        {service.location && (
                          <div className="flex items-center text-xs text-gray-600 mb-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            {service.location}
                          </div>
                        )}

                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-xl font-bold text-primary">
                            ${typeof service.price === 'number' ? service.price.toFixed(2) : service.price}/hr
                          </span>
                          {service.original_price && service.price < service.original_price && (
                            <span className="text-sm text-gray-400 line-through">
                              ${service.original_price}
                            </span>
                          )}
                        </div>

                        <Badge variant="outline" className="mb-3 text-xs border-gray-200 text-gray-600">
                          {service.category}
                        </Badge>

                        <div className="flex gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCart(service)
                            }}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Book
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGiftNow(service)
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
