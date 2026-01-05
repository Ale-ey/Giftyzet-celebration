import type { Metadata } from "next"
import WishlistPage from "@/components/wishlist/WishlistPage"

export const metadata: Metadata = {
  title: "My Wishlists - GiftyZel",
  description: "Manage your wishlists, track contributions, and never receive duplicate gifts again.",
}

export default function Wishlist() {
  return <WishlistPage />
}


