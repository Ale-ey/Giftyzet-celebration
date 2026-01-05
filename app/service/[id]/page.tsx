import type { Metadata } from "next"
import ServiceDetailPage from "@/components/service/ServiceDetailPage"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return {
    title: "Service Details",
    description: "View service details and book now",
  }
}

export default async function ServiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ServiceDetailPage serviceId={id} />
}

