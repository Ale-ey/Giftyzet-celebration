"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import OrderConfirmationModal, { OrderData } from "@/components/checkout/OrderConfirmationModal"
import { createOrder } from "@/lib/api/orders"
import { getCurrentUser } from "@/lib/api/auth"
import type { Product, Service } from "@/types"

interface CartItem extends (Product | Service) {
  quantity: number
  type: "product" | "service"
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [orderType, setOrderType] = useState<"self" | "gift">("self")

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

    // Check if coming from gift flow
    const giftItems = searchParams.get("items")
    if (giftItems) {
      try {
        const items = JSON.parse(decodeURIComponent(giftItems))
        setCartItems(items.map((item: any) => ({
          ...item,
          type: item.type || "product"
        })))
        setOrderType("gift")
        setIsModalOpen(true)
      } catch (e) {
        console.error("Error parsing gift items:", e)
      }
    } else {
      // Open modal automatically for checkout
      setIsModalOpen(true)
    }
  }, [searchParams])

  const handleConfirmOrder = async (orderData: OrderData) => {
    try {
      // Get current user (if logged in)
      const user = await getCurrentUser().catch(() => null)

      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => {
        return sum + parseFloat(item.price.replace("$", "")) * item.quantity
      }, 0)
      const shipping = subtotal > 0 ? 9.99 : 0
      const tax = subtotal * 0.08 // 8% tax
      const total = subtotal + shipping + tax

      // Prepare order items for API
      const orderItems = cartItems.map(item => ({
        item_type: item.type,
        product_id: item.type === "product" ? item.id.toString() : undefined,
        service_id: item.type === "service" ? item.id.toString() : undefined,
        name: item.name,
        price: parseFloat(item.price.replace("$", "")),
        quantity: item.quantity,
        image_url: item.image
      }))

      // Create order via Supabase API
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

      // Clear cart
      localStorage.removeItem("cart")
      window.dispatchEvent(new Event("cartUpdated"))
      window.dispatchEvent(new Event("ordersUpdated"))

      // Redirect based on order type
      if (orderData.orderType === "gift" && giftToken) {
        router.push(`/order-success?token=${giftToken}&type=gift`)
      } else {
        router.push(`/order-success?orderId=${order.id}&type=self`)
      }
    } catch (error: any) {
      console.error("Error creating order:", error)
      alert(`Failed to create order: ${error.message || "Please try again."}`)
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
        orderType={orderType}
      />
    </>
  )
}

