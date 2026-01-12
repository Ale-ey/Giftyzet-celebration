"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Heart, Calendar, Gift, Trash2, Edit2, Share2, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { wishlistTypes } from "@/lib/constants"
import { getProducts } from "@/lib/api/products"
import {
  getWishlists,
  createWishlist,
  updateWishlist,
  deleteWishlist,
  getWishlistItems,
  addProductToWishlist,
  removeWishlistItem,
  type Wishlist,
  type WishlistItem
} from "@/lib/api/wishlists"
import { getCurrentUser } from "@/lib/api/auth"
import { useToast } from "@/components/ui/toast"

export default function WishlistPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [wishlists, setWishlists] = useState<(Wishlist & { icon: React.ComponentType<{ className?: string }> })[]>([])
  const [wishlistItems, setWishlistItems] = useState<Record<string, WishlistItem[]>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null)
  const [newWishlistName, setNewWishlistName] = useState("")
  const [selectedWishlistType, setSelectedWishlistType] = useState("")
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/")
        return
      }
      setIsAuthenticated(true)
      await loadWishlists()
      await loadProducts()
    } catch (error) {
      console.error("Error checking auth:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const loadWishlists = async () => {
    try {
      const data = await getWishlists()
      const wishlistsWithIcons = data.map(wishlist => {
        const wishlistType = wishlistTypes.find(t => t.type === wishlist.type)
        return {
          ...wishlist,
          icon: wishlistType?.icon || Calendar
        }
      })
      setWishlists(wishlistsWithIcons)

      // Load items for each wishlist
      const itemsMap: Record<string, WishlistItem[]> = {}
      for (const wishlist of data) {
        try {
          const items = await getWishlistItems(wishlist.id)
          itemsMap[wishlist.id] = items
        } catch (error) {
          console.error(`Error loading items for wishlist ${wishlist.id}:`, error)
          itemsMap[wishlist.id] = []
        }
      }
      setWishlistItems(itemsMap)
    } catch (error: any) {
      console.error("Error loading wishlists:", error)
      showToast(error.message || "Failed to load wishlists", "error")
    }
  }

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data || [])
    } catch (error: any) {
      console.error("Error loading products:", error)
    }
  }

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim() || !selectedWishlistType) {
      showToast("Please enter a name and select a type", "error")
      return
    }

    try {
      await createWishlist({
        name: newWishlistName,
        type: selectedWishlistType,
        is_public: false
      })
      showToast("Wishlist created successfully", "success")
      setNewWishlistName("")
      setSelectedWishlistType("")
      setIsCreating(false)
      await loadWishlists()
    } catch (error: any) {
      console.error("Error creating wishlist:", error)
      showToast(error.message || "Failed to create wishlist", "error")
    }
  }

  const handleEditWishlist = async () => {
    if (!editingWishlist || !newWishlistName.trim() || !selectedWishlistType) {
      showToast("Please enter a name and select a type", "error")
      return
    }

    try {
      await updateWishlist(editingWishlist.id, {
        name: newWishlistName,
        type: selectedWishlistType
      })
      showToast("Wishlist updated successfully", "success")
      setNewWishlistName("")
      setSelectedWishlistType("")
      setIsEditing(false)
      setEditingWishlist(null)
      await loadWishlists()
    } catch (error: any) {
      console.error("Error updating wishlist:", error)
      showToast(error.message || "Failed to update wishlist", "error")
    }
  }

  const handleDeleteWishlist = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wishlist?")) return

    try {
      await deleteWishlist(id)
      showToast("Wishlist deleted successfully", "success")
      await loadWishlists()
    } catch (error: any) {
      console.error("Error deleting wishlist:", error)
      showToast(error.message || "Failed to delete wishlist", "error")
    }
  }

  const handleAddToWishlist = async (product: any, wishlistId: string) => {
    try {
      await addProductToWishlist(wishlistId, product.id)
      showToast("Product added to wishlist", "success")
      await loadWishlists()
      setIsAddingProduct(false)
      setSelectedWishlistId(null)
    } catch (error: any) {
      console.error("Error adding product:", error)
      showToast(error.message || "Failed to add product", "error")
    }
  }

  const handleRemoveItem = async (itemId: string, wishlistId: string) => {
    try {
      await removeWishlistItem(itemId)
      showToast("Item removed from wishlist", "success")
      await loadWishlists()
    } catch (error: any) {
      console.error("Error removing item:", error)
      showToast(error.message || "Failed to remove item", "error")
    }
  }

  const handleSendGift = (product: any) => {
    const cartItem = {
      ...product,
      quantity: 1
    }
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === product.id)
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    window.dispatchEvent(new Event("cartUpdated"))
    router.push(`/send-gift?product=${encodeURIComponent(JSON.stringify(product))}`)
  }

  const openEditModal = (wishlist: Wishlist) => {
    setEditingWishlist(wishlist)
    setNewWishlistName(wishlist.name)
    setSelectedWishlistType(wishlist.type)
    setIsEditing(true)
  }

  const calculateTotalValue = (items: WishlistItem[]) => {
    return items.reduce((total, item) => {
      const price = item.product?.price || item.service?.price || 0
      return total + Number(price)
    }, 0)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wishlists...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Wishlists</h1>
            <p className="text-gray-600">Create and manage your wishlists</p>
          </div>
          <Button
            variant="outline"
            className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
            onClick={() => {
              setIsCreating(true)
              setNewWishlistName("")
              setSelectedWishlistType("")
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Wishlist
          </Button>
        </div>

        {/* Create/Edit Wishlist Dialog */}
        <Dialog open={isCreating || isEditing} onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false)
            setIsEditing(false)
            setEditingWishlist(null)
            setNewWishlistName("")
            setSelectedWishlistType("")
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Wishlist" : "Create New Wishlist"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Wishlist Name</label>
                <Input
                  placeholder="e.g., My Birthday Wishlist"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  className="border-gray-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Wishlist Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {wishlistTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.type}
                        onClick={() => setSelectedWishlistType(type.type)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedWishlistType === type.type
                            ? "border-primary bg-primary/10"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon className={`h-6 w-6 mb-2 ${type.color}`} />
                        <p className="text-sm font-medium text-gray-900">{type.type}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                  onClick={isEditing ? handleEditWishlist : handleCreateWishlist}
                >
                  {isEditing ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium"
                  onClick={() => {
                    setIsCreating(false)
                    setIsEditing(false)
                    setEditingWishlist(null)
                    setNewWishlistName("")
                    setSelectedWishlistType("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Product Dialog */}
        <Dialog open={isAddingProduct} onOpenChange={(open) => {
          if (!open) {
            setIsAddingProduct(false)
            setSelectedWishlistId(null)
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Product to Wishlist</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const store = product.stores?.[0]
                const vendor = store?.vendors?.[0]
                return (
                  <Card
                    key={product.id}
                    className="border border-gray-200 hover:border-gray-300 cursor-pointer bg-white transition-all hover:shadow-md"
                    onClick={() => selectedWishlistId && handleAddToWishlist(product, selectedWishlistId)}
                  >
                    <div className="relative">
                      <img
                        src={product.image_url || product.images?.[0] || "/placeholder.png"}
                        alt={product.name}
                        className="w-full h-32 object-cover"
                      />
                      {product.original_price && product.original_price > product.price && (
                        <Badge className="absolute top-2 left-2 bg-secondary text-gray-900 text-xs font-semibold">
                          {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3 bg-white">
                      <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">by {vendor?.vendor_name || store?.name || "Unknown"}</p>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-primary">
                          {formatPrice(Number(product.price))}
                        </span>
                        {product.original_price && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(Number(product.original_price))}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium"
              onClick={() => {
                setIsAddingProduct(false)
                setSelectedWishlistId(null)
              }}
            >
              Cancel
            </Button>
          </DialogContent>
        </Dialog>

        {/* Wishlists Grid */}
        {wishlists.length === 0 ? (
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No wishlists yet</h3>
              <p className="text-gray-600">Create your first wishlist to start adding items</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {wishlists.map((wishlist) => {
              const Icon = wishlist.icon
              const items = wishlistItems[wishlist.id] || []
              const totalValue = calculateTotalValue(items)
              return (
                <Card key={wishlist.id} className="border-2 border-gray-100 hover:border-gray-200 bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${wishlistTypes.find(t => t.type === wishlist.type)?.bgColor || "bg-primary/10"}`}>
                          <Icon className={`h-6 w-6 ${wishlistTypes.find(t => t.type === wishlist.type)?.color || "text-primary"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-gray-900">{wishlist.name}</CardTitle>
                          <p className="text-sm text-gray-600">{wishlist.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            wishlist.is_public 
                              ? "border-primary bg-primary/10 text-primary font-medium" 
                              : "border-gray-300 bg-gray-100 text-gray-700 font-medium"
                          }`}
                        >
                          {wishlist.is_public ? "Public" : "Private"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          onClick={() => openEditModal(wishlist)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          onClick={() => handleDeleteWishlist(wishlist.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Stats */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">{items.length} items</span>
                        <span className="font-semibold text-gray-900">{formatPrice(totalValue)}</span>
                      </div>
                    </div>

                    {/* Wishlist Items */}
                    <div className="space-y-3 mb-4">
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-gray-100">No items yet</p>
                      ) : (
                        items.map((item) => {
                          const product = item.product || item.service
                          if (!product) return null
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="relative w-16 h-16 flex-shrink-0">
                                  <img
                                    src={product.image_url || product.images?.[0] || "/placeholder.png"}
                                    alt={product.name}
                                    className="w-full h-full object-cover rounded border border-gray-200"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-gray-900 truncate mb-1">{product.name}</h4>
                                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                                    <span className="font-semibold text-sm text-primary">
                                      {formatPrice(Number(product.price))}
                                    </span>
                                    {product.original_price && (
                                      <span className="text-xs text-gray-400 line-through">
                                        {formatPrice(Number(product.original_price))}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 border-gray-200 bg-white text-gray-600 hover:bg-red-600 hover:text-white hover:border-red-600"
                                  onClick={() => handleSendGift(product)}
                                  title="Send Gift"
                                >
                                  <Gift className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 border-gray-200 bg-white text-gray-400 hover:text-destructive hover:border-destructive/20"
                                  onClick={() => handleRemoveItem(item.id, wishlist.id)}
                                  title="Remove from wishlist"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium"
                        onClick={() => {
                          setIsAddingProduct(true)
                          setSelectedWishlistId(wishlist.id)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
