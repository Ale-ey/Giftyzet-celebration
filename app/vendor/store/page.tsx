import { Suspense } from "react"
import VendorStoreSetup from "@/components/vendor/VendorStoreSetup"

export default function VendorStorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>}>
      <VendorStoreSetup />
    </Suspense>
  )
}

