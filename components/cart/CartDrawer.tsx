"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [taxPercent, setTaxPercent] = useState(8)

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
  }, [isOpen])

  useEffect(() => {
    fetch("/api/settings/checkout")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.tax_percent === "number" && data.tax_percent >= 0) setTaxPercent(data.tax_percent)
      })
      .catch(() => {})
  }, [])

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        setCartItems(JSON.parse(savedCart))
      } else {
        setCartItems([])
      }
    }

    window.addEventListener("cartUpdated", handleCartUpdate)
    window.addEventListener("storage", handleCartUpdate)

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate)
      window.removeEventListener("storage", handleCartUpdate)
    }
  }, [])

  const updateCart = (updatedCart: CartItem[]) => {
    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    window.dispatchEvent(new Event("cartUpdated"))
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

  const getUnitPrice = (item: CartItem) => {
    const price = typeof item.price === "string"
      ? parseFloat(item.price.replace(/[$₹]/g, ""))
      : Number(item.price)
    return isNaN(price) ? 0 : price
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

  const handleCheckout = () => {
    onClose()
    router.push("/checkout?type=self")
  }

  const handleViewCart = () => {
    onClose()
    router.push("/cart")
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-gray-900">
                Shopping Cart ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">
                  Start adding items to your cart to see them here
                </p>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const type = item.type || "product"
                  const unitPrice = getUnitPrice(item)
                  const qty = item.quantity || 1
                  const lineTotal = unitPrice * qty
                  const isService = type === "service"
                  return (
                    <div
                      key={`${type}-${item.id}`}
                      className="flex gap-4 p-4 border-2 border-gray-100 rounded-lg hover:border-primary/20 transition-colors"
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{item.name}</h3>
                        {item.vendor && <p className="text-xs text-gray-600 mb-2">by {item.vendor}</p>}
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                            {isService ? (
                              <>
                                <span className="text-sm font-bold text-primary">${unitPrice.toFixed(2)}/hr</span>
                                <span className="text-xs text-gray-500">{qty} {qty === 1 ? "hour" : "hours"}</span>
                                <span className="text-sm font-semibold text-gray-900">= ${lineTotal.toFixed(2)}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-bold text-primary">${unitPrice.toFixed(2)}</span>
                                {item.originalPrice && <span className="text-xs text-gray-500 line-through">{item.originalPrice}</span>}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, type, qty - 1)}
                              className="h-7 w-7 p-0 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-semibold text-gray-900 w-6 text-center">
                              {isService ? `${qty} hr${qty !== 1 ? "s" : ""}` : qty}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, type, qty + 1)}
                              className="h-7 w-7 p-0 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id, type)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer with Summary */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    ${calculateSubtotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-900">Free</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span className="font-semibold text-gray-900">
                    ${((calculateSubtotal() * taxPercent) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-primary">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium"
                  onClick={handleViewCart}
                >
                  View Full Cart
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

