import type { Metadata } from "next"
import ProductDetailPage from "@/components/product/ProductDetailPage"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: "Product Details",
    description: "View product details and add to cart",
  }
}

export default function ProductDetail({ params }: { params: { id: string } }) {
  return <ProductDetailPage productId={params.id} />
}

