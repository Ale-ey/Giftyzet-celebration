import type { Metadata } from "next";
import WishlistPage from "@/components/wishlist/WishlistPage";

export const metadata: Metadata = {
  title: "My Wishlists - Create & Share Your Gift Lists | GiftyZel",
  description:
    "Manage your wishlists, track contributions, and never receive duplicate gifts again.",
  icons: {
    icon: "/logo.png",
  },
};

export default function Wishlist() {
  return <WishlistPage />;
}
