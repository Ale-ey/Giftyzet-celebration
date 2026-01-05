import type { Metadata } from "next"
import ServicesPage from "@/components/services/ServicesPage"

export const metadata: Metadata = {
  title: "Services - GiftyZel",
  description: "Browse professional services including spa treatments, home services, wellness classes, and more. Book services as gifts.",
}

export default function Services() {
  return <ServicesPage />
}

