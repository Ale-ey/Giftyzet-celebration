import type { Metadata } from "next";
import { Suspense } from "react";
import MarketplacePage from "@/components/marketplace/MarketplacePage";

export const metadata: Metadata = {
  title: "Marketplace - Browse All Products & Services | GiftyZel",
  description:
    "Browse thousands of products and services from leading brands and local businesses. Find the perfect gift for anyone.",
  icons: {
    icon: "/logo.png",
  },
};

function MarketplaceLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading marketplace...</p>
      </div>
    </div>
  );
}

export default function Marketplace() {
  return (
    <Suspense fallback={<MarketplaceLoader />}>
      <MarketplacePage />
    </Suspense>
  );
}
