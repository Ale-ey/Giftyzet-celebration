"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/types"

interface CartItem extends Product {
  quantity: number
}

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
  }, [])

  const updateCart = (updatedCart: CartItem[]) => {
    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    // Dispatch event to update cart count in header
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const removeFromCart = (productId: number) => {
    const updatedCart = cartItems.filter((item) => item.id !== productId)
    updateCart(updatedCart)
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
      return
    }
    const updatedCart = cartItems.map((item) =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    )
    updateCart(updatedCart)
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace("$", ""))
      return total + price * item.quantity
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const shipping = subtotal > 0 ? 9.99 : 0
    const tax = subtotal * 0.08 // 8% tax
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

          <Card className="border-2 border-gray-100 max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Start adding items to your cart to see them here
              </p>
              <Button
                onClick={() => router.push("/marketplace")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
            {cartItems.map((item) => (
              <Card key={item.id} className="border-2 border-gray-100">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Product Image */}
                    <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-600">by {item.vendor}</p>
                          <Badge variant="outline" className="mt-2 text-xs border-gray-300 text-gray-700">
                            {item.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl font-bold text-primary">{item.price}</span>
                          <span className="text-sm text-gray-500 line-through">{item.originalPrice}</span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="border-gray-300"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="border-gray-300"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 text-right">
                        <p className="text-sm text-gray-600">
                          Subtotal: <span className="font-bold text-gray-900">
                            ${(parseFloat(item.price.replace("$", "")) * item.quantity).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-gray-100 sticky top-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="font-semibold text-gray-900">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-semibold text-gray-900">
                      {calculateSubtotal() > 0 ? "$9.99" : "Free"}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-semibold text-gray-900">
                      ${(calculateSubtotal() * 0.08).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="lg"
                    onClick={() => router.push("/checkout")}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-primary text-primary hover:bg-primary/10"
                    size="lg"
                    onClick={() => {
                      // Gift all items
                      router.push(`/send-gift?items=${encodeURIComponent(JSON.stringify(cartItems))}`)
                    }}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Gift All Items
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

