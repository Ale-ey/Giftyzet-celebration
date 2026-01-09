"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Store, Star, ShoppingCart, Gift, Search, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getStoreByName, getStoreWithStats, getStoreProductsAndServices } from "@/lib/api/vendors"

interface VendorStorePageProps {
  vendorName: string
}

export default function VendorStorePage({ vendorName }: VendorStorePageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState<"all" | "products" | "services">("all")
  const [loading, setLoading] = useState(true)
  const [storeData, setStoreData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  // Load store data
  useEffect(() => {
    loadStoreData()
  }, [vendorName])

  const loadStoreData = async () => {
    try {
      setLoading(true)
      // Get store by name
      const store = await getStoreByName(vendorName)
      
      if (!store) {
        setStoreData(null)
        return
      }

      // Get store with stats
      const storeWithStats = await getStoreWithStats(store.id)
      setStoreData(storeWithStats)

      // Get products and services
      const { products: storeProducts, services: storeServices } = await getStoreProductsAndServices(store.id)
      setProducts(storeProducts)
      setServices(storeServices)
    } catch (error) {
      console.error("Error loading store data:", error)
      setStoreData(null)
    } finally {
      setLoading(false)
    }
  }

  // Combine products and services for filtering
  const allItems = useMemo(() => {
    let items: any[] = []
    
    if (selectedType === "all" || selectedType === "products") {
      items = [...items, ...products.map(p => ({ ...p, type: "product" }))]
    }
    
    if (selectedType === "all" || selectedType === "services") {
      items = [...items, ...services.map(s => ({ ...s, type: "service" }))]
    }
    
    return items
  }, [products, services, selectedType])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(allItems.map(item => item.category))]
    return [
      { name: "All Categories", value: "all" },
      ...cats.map(cat => ({ name: cat, value: cat }))
    ]
  }, [allItems])

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = 
        selectedCategory === "all" || item.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [allItems, searchQuery, selectedCategory])

  const handleAddToCart = (item: any) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: `$${item.price}`,
      image: item.image_url,
      quantity: 1,
      type: item.type,
      vendor: storeData?.name || vendorName
    }
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItemIndex = existingCart.findIndex((cartItem: any) => 
      cartItem.id === item.id && cartItem.type === item.type
    )
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    window.dispatchEvent(new Event("cartUpdated"))
    alert(`Added ${item.name} to cart!`)
  }

  const handleBuyNow = (item: any) => {
    handleAddToCart(item)
    const path = item.type === "product" ? `/product/${item.id}` : `/service/${item.id}`
    router.push(path)
  }

  const handleGiftNow = (item: any) => {
    handleAddToCart(item)
    router.push("/send-gift")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    )
  }

  if (!storeData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="border-2 border-gray-100">
          <CardContent className="p-12 text-center">
            <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">Vendor not found</p>
            <Button
              variant="outline"
              className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
              onClick={() => router.push("/vendors")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/vendors")}
          className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </Button>

        {/* Vendor Header */}
        <Card className="border-2 border-gray-100 bg-white mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                {storeData.logo_url ? (
                  <img
                    src={storeData.logo_url}
                    alt={storeData.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Store className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{storeData.name}</h1>
                    {storeData.stats.verified && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600">
                    {storeData.category || "General"} • {storeData.stats.totalProducts} Items
                  </p>
                  {storeData.description && (
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                      {storeData.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Vendor Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-xl font-bold text-gray-900">{storeData.stats.rating || 0}</span>
                  </div>
                  <p className="text-xs text-gray-600">{storeData.stats.totalReviews} reviews</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {storeData.stats.totalProducts}
                  </div>
                  <p className="text-xs text-gray-600">Items</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {storeData.stats.totalSales}+
                  </div>
                  <p className="text-xs text-gray-600">Sales</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search products and services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-6 text-base bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedType("all")}
              className={`${
                selectedType === "all"
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All ({products.length + services.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedType("products")}
              className={`${
                selectedType === "products"
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Products ({products.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedType("services")}
              className={`${
                selectedType === "services"
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Services ({services.length})
            </Button>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className={`${
                  selectedCategory === category.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredItems.length}</span> {selectedType === "all" ? "items" : selectedType}
          </p>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card className="border-2 border-gray-100">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No items found</p>
              <p className="text-gray-500 text-sm">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card
                key={`${item.type}-${item.id}`}
                className="group hover:shadow-xl border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden bg-white cursor-pointer"
                onClick={() => {
                  const path = item.type === "product" ? `/product/${item.id}` : `/service/${item.id}`
                  router.push(path)
                }}
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  {item.original_price && item.price < item.original_price && (
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0">
                      {Math.round(((item.original_price - item.price) / item.original_price) * 100)}% OFF
                    </Badge>
                  )}
                  <Badge className="absolute top-2 right-2 bg-primary text-white border-0 text-xs">
                    {item.type === "product" ? "Product" : "Service"}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs border-gray-200 bg-white text-gray-600">
                      {item.category}
                    </Badge>
                    <div className="flex items-center text-xs text-gray-600 font-medium">
                      <Star className="h-3.5 w-3.5 fill-current text-yellow-500 mr-1" />
                      {item.rating || 0} ({item.reviews_count || 0})
                    </div>
                  </div>

                  <h3 className="font-bold text-base mb-2 line-clamp-2 text-gray-900 group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-2 mb-4">
                    <span className="font-bold text-lg text-primary">${item.price}</span>
                    {item.original_price && item.price < item.original_price && (
                      <span className="text-sm text-gray-500 line-through">
                        ${item.original_price}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-primary hover:text-white hover:border-primary font-medium"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleGiftNow(item)
                      }}
                    >
                      <Gift className="h-4 w-4 mr-1" />
                      Gift
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(item)
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


