import type { Metadata } from "next";
import MarketplacePage from "@/components/marketplace/MarketplacePage";

export const metadata: Metadata = {
  title: "Marketplace - Browse All Products & Services | GiftyZel",
  description:
    "Browse thousands of products and services from leading brands and local businesses. Find the perfect gift for anyone.",
  icons: {
    icon: "/logo.png",
  },
};

export default function Marketplace() {
  return <MarketplacePage />;
}
