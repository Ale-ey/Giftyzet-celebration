"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
type CartItem = {
  id: string | number
  name: string
  price: number | string
  originalPrice?: string
  image?: string
  vendor?: string
  category?: string
  quantity: number
  type?: "product" | "service"
}

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [taxPercent, setTaxPercent] = useState(8)

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
  }, [])

  useEffect(() => {
    fetch("/api/settings/checkout")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.tax_percent === "number" && data.tax_percent >= 0) setTaxPercent(data.tax_percent)
      })
      .catch(() => {})
  }, [])

  const updateCart = (updatedCart: CartItem[]) => {
    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    // Dispatch event to update cart count in header
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const getUnitPrice = (item: CartItem) => {
    const price = typeof item.price === "string"
      ? parseFloat(item.price.replace(/[$₹]/g, ""))
      : Number(item.price)
    return isNaN(price) ? 0 : price
  }

  const removeFromCart = (id: string | number, type: "product" | "service" = "product") => {
    const updatedCart = cartItems.filter((item) => !(item.id === id && (item.type || "product") === type))
    updateCart(updatedCart)
  }

  const updateQuantity = (id: string | number, type: "product" | "service", newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id, type)
      return
    }
    const updatedCart = cartItems.map((item) =>
      item.id === id && (item.type || "product") === type ? { ...item, quantity: newQuantity } : item
    )
    updateCart(updatedCart)
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + getUnitPrice(item) * (item.quantity || 1)
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const shipping = 0
    const tax = (subtotal * taxPercent) / 100
    return subtotal + shipping + tax
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <Button
            variant="ghost"
            onClick={() => router.push("/marketplace")}
            className="mb-8 text-gray-900 hover:text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>

          <Card className="border border-gray-200 bg-white text-gray-900 max-w-2xl mx-auto shadow-sm">
            <CardContent className="p-12 text-center bg-white text-gray-900">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Start adding items to your cart to see them here
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/marketplace")}
                className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
              >
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Shopping Cart</h1>
          <Button
            variant="ghost"
            onClick={() => router.push("/marketplace")}
            className="text-gray-900 hover:text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const type = item.type || "product"
              const unitPrice = getUnitPrice(item)
              const qty = item.quantity || 1
              const lineTotal = unitPrice * qty
              const isService = type === "service"
              return (
                <Card key={`${type}-${item.id}`} className="border border-gray-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                            {item.vendor && <p className="text-sm text-gray-500">by {item.vendor}</p>}
                            {item.category && (
                              <Badge variant="outline" className="mt-2 text-xs border-gray-200 bg-white text-gray-600">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item.id, type)}
                            className="border-gray-200 bg-white text-gray-400 hover:text-destructive hover:border-destructive/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                          <div className="flex items-center space-x-4">
                            {isService ? (
                              <>
                                <span className="text-xl font-bold text-primary">${unitPrice.toFixed(2)}/hr</span>
                                <span className="text-sm text-gray-500">{qty} {qty === 1 ? "hour" : "hours"}</span>
                                <span className="text-lg font-semibold text-gray-900">= ${lineTotal.toFixed(2)}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-2xl font-bold text-primary">${unitPrice.toFixed(2)}</span>
                                {item.originalPrice && <span className="text-sm text-gray-500 line-through">{item.originalPrice}</span>}
                              </>
                            )}
                          </div>

                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, type, qty - 1)}
                              className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                              {isService ? `${qty} hr${qty !== 1 ? "s" : ""}` : qty}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, type, qty + 1)}
                              className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 text-right">
                          <p className="text-sm text-gray-600">
                            Line total: <span className="font-bold text-gray-900">${lineTotal.toFixed(2)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 bg-gray-50/50 sticky top-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="font-medium text-gray-700">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium text-gray-700">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-medium text-gray-700">
                      ${((calculateSubtotal() * taxPercent) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-semibold text-primary">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                    size="lg"
                    onClick={() => router.push("/checkout?type=self")}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

