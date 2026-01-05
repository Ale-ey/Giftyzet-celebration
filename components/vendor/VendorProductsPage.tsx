"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Package, Wrench, ArrowLeft, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getStoreByVendorId, getVendors } from "@/lib/vendor-data"
import { getVendorProducts, getVendorServices, saveVendorProduct, saveVendorService, deleteVendorProduct, deleteVendorService } from "@/lib/product-data"
import AddProductDialog from "./AddProductDialog"
import AddServiceDialog from "./AddServiceDialog"
import type { Store, Product, Service } from "@/types"
import { allProducts, allServices } from "@/lib/constants"

export default function VendorProductsPage() {
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"products" | "services">("products")
  const [vendorProducts, setVendorProducts] = useState<Product[]>([])
  const [vendorServices, setVendorServices] = useState<Service[]>([])
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const vendors = getVendors()
    
    // Use first vendor if exists, or create a demo vendor
    let vendor = vendors[0]
    
    if (!vendor) {
      const { saveVendor, saveStore } = require("@/lib/vendor-data")
      const vendorId = `vendor-${Date.now()}`
      vendor = {
        id: vendorId,
        email: "demo@vendor.com",
        name: "Demo Vendor",
        vendorName: "Demo Store",
        role: "vendor" as const,
        createdAt: new Date().toISOString()
      }
      saveVendor(vendor)
      
      // Create store with approved status for testing
      const store = {
        id: `store-${Date.now()}`,
        vendorId,
        name: "Demo Store",
        status: "approved" as const,
        createdAt: new Date().toISOString()
      }
      saveStore(store)
    }

    const vendorStore = getStoreByVendorId(vendor.id)
    setStore(vendorStore || null)
    
    // Get vendor products/services from localStorage and combine with default products
    const customProducts = getVendorProducts().filter((p) => p.vendor === vendor.vendorName)
    const defaultProducts = allProducts.filter((p) => p.vendor === vendor.vendorName)
    const allVendorProducts = [...defaultProducts, ...customProducts]
    
    const customServices = getVendorServices().filter((s) => s.vendor === vendor.vendorName)
    const defaultServices = allServices.filter((s) => s.vendor === vendor.vendorName)
    const allVendorServices = [...defaultServices, ...customServices]
    
    setVendorProducts(allVendorProducts)
    setVendorServices(allVendorServices)
    
    setLoading(false)

    // Listen for updates
    const handleProductsUpdate = () => {
      const updated = getVendorProducts().filter((p) => p.vendor === vendor.vendorName)
      const defaultProds = allProducts.filter((p) => p.vendor === vendor.vendorName)
      setVendorProducts([...defaultProds, ...updated])
    }

    const handleServicesUpdate = () => {
      const updated = getVendorServices().filter((s) => s.vendor === vendor.vendorName)
      const defaultServs = allServices.filter((s) => s.vendor === vendor.vendorName)
      setVendorServices([...defaultServs, ...updated])
    }

    window.addEventListener("vendorProductsUpdated", handleProductsUpdate)
    window.addEventListener("vendorServicesUpdated", handleServicesUpdate)

    return () => {
      window.removeEventListener("vendorProductsUpdated", handleProductsUpdate)
      window.removeEventListener("vendorServicesUpdated", handleServicesUpdate)
    }
  }, [router])

  const handleAddProduct = (productData: Omit<Product, "id" | "rating" | "reviews" | "vendor">) => {
    const vendors = getVendors()
    const vendor = vendors[0]
    if (!vendor) return

    const newProduct: Product = {
      ...productData,
      id: Date.now(),
      rating: 0,
      reviews: 0,
      vendor: vendor.vendorName
    }
    saveVendorProduct(newProduct)
    const updated = getVendorProducts().filter((p) => p.vendor === vendor.vendorName)
    const defaultProds = allProducts.filter((p) => p.vendor === vendor.vendorName)
    setVendorProducts([...defaultProds, ...updated])
  }

  const handleAddService = (serviceData: Omit<Service, "id" | "rating" | "reviews" | "vendor">) => {
    const vendors = getVendors()
    const vendor = vendors[0]
    if (!vendor) return

    const newService: Service = {
      ...serviceData,
      id: Date.now(),
      rating: 0,
      reviews: 0,
      vendor: vendor.vendorName
    }
    saveVendorService(newService)
    const updated = getVendorServices().filter((s) => s.vendor === vendor.vendorName)
    const defaultServs = allServices.filter((s) => s.vendor === vendor.vendorName)
    setVendorServices([...defaultServs, ...updated])
  }

  const handleDeleteProduct = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteVendorProduct(productId)
      const vendors = getVendors()
      const vendor = vendors[0]
      if (vendor) {
        const updated = getVendorProducts().filter((p) => p.vendor === vendor.vendorName)
        const defaultProds = allProducts.filter((p) => p.vendor === vendor.vendorName)
        setVendorProducts([...defaultProds, ...updated])
      }
    }
  }

  const handleDeleteService = (serviceId: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteVendorService(serviceId)
      const vendors = getVendors()
      const vendor = vendors[0]
      if (vendor) {
        const updated = getVendorServices().filter((s) => s.vendor === vendor.vendorName)
        const defaultServs = allServices.filter((s) => s.vendor === vendor.vendorName)
        setVendorServices([...defaultServs, ...updated])
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/vendor")}
          className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products & Services</h1>
          <p className="text-gray-600">Manage your products and services</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Products ({vendorProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "services"
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Wrench className="h-4 w-4 inline mr-2" />
            Services ({vendorServices.length})
          </button>
        </div>

        {/* Add New Button */}
        <div className="mb-6">
          <Button
            onClick={() => {
              if (activeTab === "products") {
                setIsProductDialogOpen(true)
              } else {
                setIsServiceDialogOpen(true)
              }
            }}
            className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === "products" ? "Product" : "Service"}
          </Button>
        </div>

        {/* Products List */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorProducts.length === 0 ? (
              <Card className="border border-gray-200 bg-white col-span-full">
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start adding products to your store
                  </p>
                  <Button
                    onClick={() => setIsProductDialogOpen(true)}
                    className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Product
                  </Button>
                </CardContent>
              </Card>
            ) : (
              vendorProducts.map((product) => (
                <Card key={product.id} className="border border-gray-200 bg-white">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-gray-900">{product.name}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {product.price} • {product.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Services List */}
        {activeTab === "services" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorServices.length === 0 ? (
              <Card className="border border-gray-200 bg-white col-span-full">
                <CardContent className="p-12 text-center">
                  <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start adding services to your store
                  </p>
                  <Button
                    onClick={() => setIsServiceDialogOpen(true)}
                    className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Service
                  </Button>
                </CardContent>
              </Card>
            ) : (
              vendorServices.map((service) => (
                <Card key={service.id} className="border border-gray-200 bg-white">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-gray-900">{service.name}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {service.price} • {service.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteService(service.id)}
                        className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Dialogs */}
        <AddProductDialog
          isOpen={isProductDialogOpen}
          onClose={() => setIsProductDialogOpen(false)}
          onSave={handleAddProduct}
        />
        <AddServiceDialog
          isOpen={isServiceDialogOpen}
          onClose={() => setIsServiceDialogOpen(false)}
          onSave={handleAddService}
        />
      </div>
    </div>
  )
}

