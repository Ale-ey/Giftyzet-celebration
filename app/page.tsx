import type { Metadata } from "next"
import { Suspense } from "react"
import HeroSection from "@/components/HeroSection"
import FeaturesSection from "@/components/FeaturesSection"
import MarketplacePreview from "@/components/MarketplacePreview"
import WishlistSection from "@/components/WishlistSection"

export const metadata: Metadata = {
  title: "GiftyZel - Send Perfect Gifts Without Knowing Addresses",
  description: "Send thoughtful gifts to anyone using just their phone number, email, or social media. No addresses needed. Privacy-first gifting platform with thousands of products and services.",
  keywords: ["gifts", "gift delivery", "send gifts", "wishlist", "gift registry", "privacy", "gifting platform"],
  openGraph: {
    title: "GiftyZel - Send Perfect Gifts Without Knowing Addresses",
    description: "Send thoughtful gifts to anyone using just their phone number, email, or social media.",
    type: "website",
  },
}

function SectionSkeleton() {
  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto mb-8"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-12"></div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <MarketplacePreview />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton />}>
        <WishlistSection />
      </Suspense>
    </main>
  )
}
