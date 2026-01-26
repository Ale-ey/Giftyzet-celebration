import type { Metadata } from "next";
import CartPage from "@/components/cart/CartPage";

export const metadata: Metadata = {
  title: "Shopping Cart - Review Your Items | GiftyZel",
  description: "Review your cart items and proceed to checkout",
  icons: {
    icon: "/logo.png",
  },
};

export default function Cart() {
  return <CartPage />;
}
