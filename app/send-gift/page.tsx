"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import OrderConfirmationModal, { OrderData } from "@/components/checkout/OrderConfirmationModal"
import type { Product, Service } from "@/types"

type CartItem = (Product | Service) & {
  quantity: number
  type: "product" | "service"
}

function SendGiftContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [taxPercent, setTaxPercent] = useState(8)

  useEffect(() => {
    fetch("/api/settings/checkout")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.tax_percent === "number" && data.tax_percent >= 0) setTaxPercent(data.tax_percent)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Get items from query params
    const itemsParam = searchParams.get("items")
    const productParam = searchParams.get("product")
    const serviceParam = searchParams.get("service")

    let items: CartItem[] = []

    if (itemsParam) {
      try {
        items = JSON.parse(decodeURIComponent(itemsParam))
      } catch (e) {
        console.error("Error parsing items:", e)
      }
    } else if (productParam) {
      try {
        const product = JSON.parse(decodeURIComponent(productParam))
        items = [{ ...product, quantity: 1, type: "product" }]
      } catch (e) {
        console.error("Error parsing product:", e)
      }
    } else if (serviceParam) {
      try {
        const service = JSON.parse(decodeURIComponent(serviceParam))
        items = [{ ...service, quantity: 1, type: "service" }]
      } catch (e) {
        console.error("Error parsing service:", e)
      }
    }

    if (items.length > 0) {
      setCartItems(items.map((item: any) => ({
        ...item,
        type: item.type || ("image" in item ? "product" : "service")
      })))
    } else {
      // If no items, redirect to marketplace
      router.push("/marketplace")
    }
  }, [searchParams, router])

  const handleConfirmOrder = async (orderData: OrderData) => {
    try {
      // Create order
      const orders = JSON.parse(localStorage.getItem("orders") || "[]")
      const newOrder = {
        id: Date.now(),
        orderNumber: `ORD-${Date.now()}`,
        items: cartItems,
        ...orderData,
        total: cartItems.reduce((sum, item) => {
          const price = typeof item.price === 'string' 
            ? parseFloat(item.price.replace("$", ""))
            : parseFloat(String(item.price))
          return sum + (isNaN(price) ? 0 : price) * item.quantity
        }, 0),
        status: "pending", // Gift orders start as pending until receiver confirms
        createdAt: new Date().toISOString(),
        paymentStatus: "pending"
      }

      orders.push(newOrder)
      localStorage.setItem("orders", JSON.stringify(orders))
      window.dispatchEvent(new Event("ordersUpdated"))

      // Clear cart
      localStorage.removeItem("cart")
      window.dispatchEvent(new Event("cartUpdated"))

      // Generate gift token and link
      const giftToken = `gift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(`gift_${giftToken}`, JSON.stringify({
        orderId: newOrder.id,
        senderName: orderData.senderName,
        receiverEmail: orderData.receiverEmail,
        items: cartItems,
        senderAddress: orderData.senderAddress,
        receiverName: orderData.receiverName,
        receiverPhone: orderData.receiverPhone
      }))

      // Redirect to success page with gift link
      router.push(`/order-success?token=${giftToken}&type=gift`)
    } catch (error) {
      console.error("Error creating gift order:", error)
      alert("Failed to create gift order. Please try again.")
    }
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
        orderType="gift"
        taxPercent={taxPercent}
      />
    </>
  )
}

export default function SendGiftPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading gift order...</p>
        </div>
      </div>
    }>
      <SendGiftContent />
    </Suspense>
  )
}
