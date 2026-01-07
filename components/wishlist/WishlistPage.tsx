"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Heart, Calendar, Gift, Star, Trash2, Edit2, Share2, Users, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { wishlistTypes } from "@/lib/constants"
import { allProducts } from "@/lib/constants"
import type { Product } from "@/types"

interface WishlistItem extends Product {
  priority: "Essential" | "Nice-to-have" | "Optional"
  funded: number
  contributors: number
  addedDate: string
}

interface WishlistData {
  id: string
  name: string
  type: string
  items: WishlistItem[]
  contributors: number
  totalValue: string
  progress: number
  isPublic: boolean
  createdDate: string
}

interface Wishlist extends WishlistData {
  icon: React.ComponentType<{ className?: string }>
}

export default function WishlistPage() {
  const router = useRouter()
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newWishlistName, setNewWishlistName] = useState("")
  const [selectedWishlistType, setSelectedWishlistType] = useState("")
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Load wishlists from localStorage
    const savedWishlists = localStorage.getItem("wishlists")
    if (savedWishlists) {
      try {
        const wishlistsData: WishlistData[] = JSON.parse(savedWishlists)
        // Map icon components back from type string
        const wishlistsWithIcons: Wishlist[] = wishlistsData.map(wishlist => {
          const wishlistType = wishlistTypes.find(t => t.type === wishlist.type)
          return {
            ...wishlist,
            icon: wishlistType?.icon || Calendar
          }
        })
        setWishlists(wishlistsWithIcons)
      } catch (e) {
        console.error("Error loading wishlists:", e)
      }
    } else {
      // Initialize with sample wishlists
      const sampleWishlistsData: WishlistData[] = [
        {
          id: "1",
          name: "My Birthday Wishlist",
          type: "Birthday Wishlist",
          items: [
            {
              ...allProducts[0],
              priority: "Essential",
              funded: 50,
              contributors: 3,
              addedDate: "2024-01-15"
            },
            {
              ...allProducts[1],
              priority: "Nice-to-have",
              funded: 100,
              contributors: 5,
              addedDate: "2024-01-20"
            }
          ],
          contributors: 8,
          totalValue: "$450",
          progress: 65,
          isPublic: true,
          createdDate: "2024-01-10"
        }
      ]
      // Map icon components
      const sampleWishlists: Wishlist[] = sampleWishlistsData.map(wishlist => {
        const wishlistType = wishlistTypes.find(t => t.type === wishlist.type)
        return {
          ...wishlist,
          icon: wishlistType?.icon || Calendar
        }
      })
      setWishlists(sampleWishlists)
      localStorage.setItem("wishlists", JSON.stringify(sampleWishlistsData))
    }
  }, [])

  const saveWishlists = (updatedWishlists: Wishlist[]) => {
    setWishlists(updatedWishlists)
    // Save without icon components (only store data)
    const wishlistsData: WishlistData[] = updatedWishlists.map(({ icon, ...rest }) => rest)
    localStorage.setItem("wishlists", JSON.stringify(wishlistsData))
  }

  const handleCreateWishlist = () => {
    if (!newWishlistName.trim() || !selectedWishlistType) return

    const wishlistType = wishlistTypes.find(t => t.type === selectedWishlistType)
    if (!wishlistType) return

    const newWishlist: Wishlist = {
      id: Date.now().toString(),
      name: newWishlistName,
      type: selectedWishlistType,
      icon: wishlistType.icon,
      items: [],
      contributors: 0,
      totalValue: "$0",
      progress: 0,
      isPublic: false,
      createdDate: new Date().toISOString()
    }

    const updatedWishlists = [...wishlists, newWishlist]
    saveWishlists(updatedWishlists)
    setNewWishlistName("")
    setSelectedWishlistType("")
    setIsCreating(false)
  }

  const handleDeleteWishlist = (id: string) => {
    if (confirm("Are you sure you want to delete this wishlist?")) {
      const updatedWishlists = wishlists.filter(w => w.id !== id)
      saveWishlists(updatedWishlists)
    }
  }

  const handleAddToWishlist = (product: Product, wishlistId: string) => {
    const updatedWishlists = wishlists.map(wishlist => {
      if (wishlist.id === wishlistId) {
        const wishlistItem: WishlistItem = {
          ...product,
          priority: "Nice-to-have",
          funded: 0,
          contributors: 0,
          addedDate: new Date().toISOString()
        }
        return {
          ...wishlist,
          items: [...wishlist.items, wishlistItem]
        }
      }
      return wishlist
    })
    saveWishlists(updatedWishlists)
    setIsAddingProduct(false)
    setSelectedWishlistId(null)
  }

  const handleRemoveItem = (wishlistId: string, productId: number) => {
    const updatedWishlists = wishlists.map(wishlist => {
      if (wishlist.id === wishlistId) {
        return {
          ...wishlist,
          items: wishlist.items.filter(item => item.id !== productId)
        }
      }
      return wishlist
    })
    saveWishlists(updatedWishlists)
  }

  const handleSendGift = (product: Product) => {
    const cartItem = {
      ...product,
      quantity: 1
    }
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItemIndex = existingCart.findIndex((item: Product & { quantity: number }) => item.id === product.id)
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem("cart", JSON.stringify(existingCart))
    window.dispatchEvent(new Event("cartUpdated"))
    router.push(`/send-gift?product=${encodeURIComponent(JSON.stringify(product))}`)
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
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Wishlist
          </Button>
        </div>

        {/* Create Wishlist Modal */}
        {isCreating && (
          <Card className="mb-8 border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Create New Wishlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  onClick={handleCreateWishlist}
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium"
                  onClick={() => {
                    setIsCreating(false)
                    setNewWishlistName("")
                    setSelectedWishlistType("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Product Modal */}
        {isAddingProduct && (
          <Card className="mb-8 border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Add Product to Wishlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {allProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="border border-gray-200 hover:border-gray-300 cursor-pointer bg-white transition-all hover:shadow-md"
                    onClick={() => selectedWishlistId && handleAddToWishlist(product, selectedWishlistId)}
                  >
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-32 object-cover"
                      />
                      <Badge className="absolute top-2 left-2 bg-secondary text-gray-900 text-xs font-semibold">
                        {product.discount}
                      </Badge>
                    </div>
                    <CardContent className="p-3 bg-white">
                      <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">by {product.vendor}</p>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-primary">{product.price}</span>
                        <span className="text-xs text-gray-400 line-through">{product.originalPrice}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
            </CardContent>
          </Card>
        )}

        {/* Wishlists Grid */}
        {wishlists.length === 0 ? (
          <Card className="border-2 border-gray-100">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No wishlists yet</h3>
              <p className="text-gray-600 mb-6">Create your first wishlist to start adding items</p>
              <Button
                variant="outline"
                className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Wishlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {wishlists.map((wishlist) => {
              const Icon = wishlist.icon
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
                            wishlist.isPublic 
                              ? "border-primary bg-primary/10 text-primary font-medium" 
                              : "border-gray-300 bg-gray-100 text-gray-700 font-medium"
                          }`}
                        >
                          {wishlist.isPublic ? "Public" : "Private"}
                        </Badge>
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
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">{wishlist.items.length} items</span>
                        <span className="font-semibold text-gray-900">{wishlist.totalValue}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${wishlist.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                        <span>{wishlist.progress}% complete</span>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {wishlist.contributors} contributors
                        </div>
                      </div>
                    </div>

                    {/* Wishlist Items */}
                    <div className="space-y-3 mb-4">
                      {wishlist.items.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-gray-100">No items yet</p>
                      ) : (
                        wishlist.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="relative w-16 h-16 flex-shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded border border-gray-200"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-900 truncate mb-1">{item.name}</h4>
                                <p className="text-xs text-gray-500 mb-1">by {item.vendor}</p>
                                <div className="flex items-center space-x-2 flex-wrap gap-1">
                                  <span className="font-semibold text-sm text-primary">{item.price}</span>
                                  {item.originalPrice && (
                                    <span className="text-xs text-gray-400 line-through">{item.originalPrice}</span>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      item.priority === "Essential"
                                        ? "border-primary bg-primary/5 text-primary"
                                        : item.priority === "Nice-to-have"
                                        ? "border-secondary bg-secondary/5 text-secondary"
                                        : "border-gray-300 bg-gray-50 text-gray-600"
                                    }`}
                                  >
                                    {item.priority}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-gray-200 bg-white text-gray-600 hover:bg-red-600 hover:text-white hover:border-red-600"
                                onClick={() => handleSendGift(item)}
                                title="Send Gift"
                              >
                                <Gift className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-gray-200 bg-white text-gray-400 hover:text-destructive hover:border-destructive/20"
                                onClick={() => handleRemoveItem(wishlist.id, item.id)}
                                title="Remove from wishlist"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
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

