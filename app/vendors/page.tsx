import type { Metadata } from "next";
import VendorsPage from "@/components/vendors/VendorsPage";

export const metadata: Metadata = {
  title: "Top Vendors - Trusted Brands & Businesses | GiftyZel",
  description:
    "Discover top-rated vendors and their products. Shop from trusted brands and local businesses.",
  icons: {
    icon: "/logo.png",
  },
};

export default function Vendors() {
  return <VendorsPage />;
}
