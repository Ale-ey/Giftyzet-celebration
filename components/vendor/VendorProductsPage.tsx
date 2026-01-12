"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Package, Wrench, ArrowLeft, Edit, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { getCurrentUser } from "@/lib/api/auth"
import { getVendorByUserId, getStoreByVendorId } from "@/lib/api/vendors"
import { 
  getProductsByStore, 
  getServicesByStore, 
  deleteProduct as apiDeleteProduct,
  deleteService as apiDeleteService
} from "@/lib/api/products"
import AddProductDialog from "./AddProductDialog"
import AddServiceDialog from "./AddServiceDialog"
import DeleteConfirmationModal from "./DeleteConfirmationModal"

export default function VendorProductsPage() {
  const router = useRouter()
  const [store, setStore] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"products" | "services">("products")
  const [vendorProducts, setVendorProducts] = useState<any[]>([])
  const [vendorServices, setVendorServices] = useState<any[]>([])
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: "product" | "service" } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)
  const itemsPerPage = 12

  useEffect(() => {
    loadVendorData()
  }, [])

  const loadVendorData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const user = await getCurrentUser()
      if (!user) {
        router.push("/")
        return
      }

      // Get vendor profile
      const vendor = await getVendorByUserId(user.id)
    if (!vendor) {
        router.push("/vendor/register-store")
        return
      }

      // Get store
      const vendorStore = await getStoreByVendorId(vendor.id)
      if (!vendorStore) {
        router.push("/vendor/register-store")
        return
      }

      // Check if store is suspended
      if (vendorStore.status === "suspended") {
        router.push("/vendor")
        return
      }

      // Check if store is not approved
      if (vendorStore.status !== "approved") {
        router.push("/vendor/register-store")
        return
      }

      setStore(vendorStore)

      // Load products and services from Supabase
      await loadProducts(vendorStore.id)
      await loadServices(vendorStore.id)
    } catch (error) {
      console.error("Error loading vendor data:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async (storeId: string) => {
    try {
      const products = await getProductsByStore(storeId)
      setVendorProducts(products || [])
    } catch (error) {
      console.error("Error loading products:", error)
      setVendorProducts([])
    }
  }

  const loadServices = async (storeId: string) => {
    try {
      const services = await getServicesByStore(storeId)
      setVendorServices(services || [])
    } catch (error) {
      console.error("Error loading services:", error)
      setVendorServices([])
    }
  }

  const handleAddProduct = async () => {
    if (!store) return
    
    try {
      // Reload products after save
      await loadProducts(store.id)
    } catch (error) {
      console.error("Error reloading products:", error)
    }
  }

  const handleAddService = async () => {
    if (!store) return
    
    try {
      // Reload services after save
      await loadServices(store.id)
    } catch (error) {
      console.error("Error reloading services:", error)
    }
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setIsProductDialogOpen(true)
  }

  const handleEditService = (service: any) => {
    setEditingService(service)
    setIsServiceDialogOpen(true)
  }

  const handleDeleteClick = (id: string, name: string, type: "product" | "service") => {
    setItemToDelete({ id, name, type })
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !store) return

    setActionLoading(true)
    try {
    if (itemToDelete.type === "product") {
        await apiDeleteProduct(itemToDelete.id)
        await loadProducts(store.id)
      } else {
        await apiDeleteService(itemToDelete.id)
        await loadServices(store.id)
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      alert(`Failed to delete ${itemToDelete.type}. Please try again.`)
    } finally {
      setActionLoading(false)
      setItemToDelete(null)
      setDeleteModalOpen(false)
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
          onClick={() => router.push("/vendor/dashboard")}
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
            onClick={() => {
              setActiveTab("products")
              setCurrentPage(1)
            }}
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
            onClick={() => {
              setActiveTab("services")
              setCurrentPage(1)
            }}
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
        {activeTab === "products" && (() => {
          const totalPages = Math.ceil(vendorProducts.length / itemsPerPage)
          const startIndex = (currentPage - 1) * itemsPerPage
          const endIndex = startIndex + itemsPerPage
          const paginatedProducts = vendorProducts.slice(startIndex, endIndex)

          return (
            <>
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
                  paginatedProducts.map((product) => (
                <Card key={product.id} className="border border-gray-200 bg-white">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                    {product.image_url ? (
                    <img
                        src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Package className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-gray-900">{product.name}</CardTitle>
                        <CardDescription className="text-gray-600">
                          ${product.price} • {product.category}
                        </CardDescription>
                      </div>
                      <Badge className={product.available !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {product.available !== false ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        disabled={actionLoading}
                        className="flex-1 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(product.id, product.name, "product")}
                        disabled={actionLoading}
                        className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                  ))
                )}
              </div>

              {/* Pagination */}
              {vendorProducts.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={vendorProducts.length}
                />
              )}
            </>
          )
        })()}

        {/* Services List */}
        {activeTab === "services" && (() => {
          const totalPages = Math.ceil(vendorServices.length / itemsPerPage)
          const startIndex = (currentPage - 1) * itemsPerPage
          const endIndex = startIndex + itemsPerPage
          const paginatedServices = vendorServices.slice(startIndex, endIndex)

          return (
            <>
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
                  paginatedServices.map((service) => (
                <Card key={service.id} className="border border-gray-200 bg-white">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                    {service.image_url ? (
                    <img
                        src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Wrench className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-gray-900">{service.name}</CardTitle>
                        <CardDescription className="text-gray-600">
                          ${service.price} • {service.category}
                        </CardDescription>
                      </div>
                      <Badge className={service.available !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {service.available !== false ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditService(service)}
                        disabled={actionLoading}
                        className="flex-1 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(service.id, service.name, "service")}
                        disabled={actionLoading}
                        className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                  ))
                )}
              </div>

              {/* Pagination */}
              {vendorServices.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={vendorServices.length}
                />
              )}
            </>
          )
        })()}

        {/* Dialogs */}
        <AddProductDialog
          isOpen={isProductDialogOpen}
          onClose={() => {
            setIsProductDialogOpen(false)
            setEditingProduct(null)
          }}
          onSave={handleAddProduct}
          editProduct={editingProduct}
          storeId={store?.id}
        />
        <AddServiceDialog
          isOpen={isServiceDialogOpen}
          onClose={() => {
            setIsServiceDialogOpen(false)
            setEditingService(null)
          }}
          onSave={handleAddService}
          editService={editingService}
          storeId={store?.id}
        />
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setItemToDelete(null)
          }}
          onConfirm={handleDeleteConfirm}
          title={`Delete ${itemToDelete?.type === "product" ? "Product" : "Service"}?`}
          itemName={itemToDelete?.name || ""}
          itemType={itemToDelete?.type || "product"}
        />
      </div>
    </div>
  )
}

