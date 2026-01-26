import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "GiftyZel - Send Perfect Gifts Without Knowing Addresses",
  description:
    "Send thoughtful gifts to anyone using just their phone number, email, or social media. No addresses needed. Privacy-first gifting platform with thousands of products and services.",
  keywords: [
    "gifts",
    "gift delivery",
    "send gifts",
    "wishlist",
    "gift registry",
    "privacy",
    "gifting platform",
  ],
  openGraph: {
    title: "GiftyZel - Send Perfect Gifts Without Knowing Addresses",
    description:
      "Send thoughtful gifts to anyone using just their phone number, email, or social media.",
    type: "website",
  },
  icons: {
    icon: "/logo.png",
  },
};

export default function Home() {
  return <LandingPage />;
}
