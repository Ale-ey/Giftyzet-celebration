import type { Metadata } from "next"
import CartPage from "@/components/cart/CartPage"

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your cart items and proceed to checkout",
}

export default function Cart() {
  return <CartPage />
}

