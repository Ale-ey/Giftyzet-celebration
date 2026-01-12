import type { Metadata } from "next"
import VendorStorePage from "@/components/vendors/VendorStorePage"

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  const decodedName = decodeURIComponent(name)
  return {
    title: `${decodedName} Store - GiftyZel`,
    description: `Browse all products from ${decodedName}. Shop quality products with fast delivery.`,
  }
}

export default async function VendorStore({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  return <VendorStorePage vendorName={decodeURIComponent(name)} />
}


