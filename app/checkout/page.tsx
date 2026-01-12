"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import OrderConfirmationModal, { OrderData } from "@/components/checkout/OrderConfirmationModal"
import { createOrder } from "@/lib/api/orders"
import { getCurrentUser } from "@/lib/api/auth"
import { useToast } from "@/components/ui/toast"
import type { Product, Service } from "@/types"

type CartItem = (Product | Service) & {
  quantity: number
  type: "product" | "service"
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Load cart items
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      const items = JSON.parse(savedCart)
      // Add type field if missing
      const typedItems = items.map((item: any) => ({
        ...item,
        type: item.type || "product" // Default to product if not specified
      }))
      setCartItems(typedItems)
    }

    // Open modal automatically for checkout
    setIsModalOpen(true)
  }, [searchParams])

  const handleConfirmOrder = async (orderData: OrderData) => {
    try {
      showToast("Processing your order...", "info")
      
      // Get current user (if logged in)
      const user = await getCurrentUser().catch(() => null)

      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => {
        const price = typeof item.price === 'string' 
          ? parseFloat(item.price.replace(/[$₹]/g, ""))
          : parseFloat(String(item.price))
        return sum + (isNaN(price) ? 0 : price) * item.quantity
      }, 0)
      const shipping = subtotal > 0 ? 9.99 : 0
      const tax = subtotal * 0.08 // 8% tax
      const total = subtotal + shipping + tax

      // Prepare order items for API
      const orderItems = cartItems.map(item => {
        const price = typeof item.price === 'string' 
          ? parseFloat(item.price.replace(/[$₹]/g, ""))
          : parseFloat(String(item.price))
        return {
          item_type: item.type,
          product_id: item.type === "product" ? item.id.toString() : undefined,
          service_id: item.type === "service" ? item.id.toString() : undefined,
          name: item.name,
          price: isNaN(price) ? 0 : price,
          quantity: item.quantity,
          image_url: item.image
        }
      })

      // Create order via Supabase API (with pending payment status)
      const { order, giftToken, giftLink } = await createOrder({
        user_id: user?.id || undefined,
        order_type: orderData.orderType,
        sender_name: orderData.senderName,
        sender_email: orderData.senderEmail,
        sender_phone: orderData.senderPhone,
        sender_address: orderData.senderAddress,
        receiver_name: orderData.receiverName,
        receiver_email: orderData.receiverEmail,
        receiver_phone: orderData.receiverPhone,
        receiver_address: orderData.receiverAddress,
        shipping_address: orderData.orderType === "self" ? orderData.senderAddress : undefined,
        items: orderItems,
        subtotal,
        shipping,
        tax,
        total
      })

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            ...item,
            description: item.description || '',
            category: item.category || 'N/A',
          })),
          orderData,
          orderId: order.id,
          giftToken,
        }),
      })

      const session = await response.json()

      if (!response.ok) {
        throw new Error(session.error || 'Failed to create checkout session')
      }

      // Verify we have a checkout URL
      if (!session.url) {
        throw new Error('No checkout URL received from Stripe')
      }

      // Store gift link delivery info in localStorage for order success page
      if (orderData.orderType === "gift" && orderData.giftLinkDeliveryMethod) {
        localStorage.setItem("giftLinkDelivery", JSON.stringify({
          method: orderData.giftLinkDeliveryMethod,
          receiverName: orderData.receiverName,
          receiverEmail: orderData.receiverEmail,
          receiverPhone: orderData.receiverPhone,
          senderName: orderData.senderName,
          giftLink: giftLink,
          orderId: order.id
        }))
      }

      // Clear cart before redirecting to Stripe
      localStorage.removeItem("cart")
      window.dispatchEvent(new Event("cartUpdated"))

      // Redirect directly to Stripe Checkout URL (new method)
      window.location.href = session.url
    } catch (error: any) {
      console.error("Error creating order:", error)
      showToast(error.message || "Failed to create order. Please try again.", "error")
    }
  }

  if (cartItems.length === 0 && !isModalOpen) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
          <button
            onClick={() => router.push("/marketplace")}
            className="text-primary hover:underline"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <OrderConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          router.push("/cart")
        }}
        onConfirm={handleConfirmOrder}
        cartItems={cartItems}
        orderType="self"
      />
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
