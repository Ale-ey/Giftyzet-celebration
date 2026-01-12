import type { Metadata } from "next"
import VendorsPage from "@/components/vendors/VendorsPage"

export const metadata: Metadata = {
  title: "Top Vendors - GiftyZel",
  description: "Discover top-rated vendors and their products. Shop from trusted brands and local businesses.",
}

export default function Vendors() {
  return <VendorsPage />
}


