import type { Metadata } from "next"
import ProductDetailPage from "@/components/product/ProductDetailPage"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return {
    title: "Product Details",
    description: "View product details and add to cart",
  }
}

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProductDetailPage productId={id} />
}

