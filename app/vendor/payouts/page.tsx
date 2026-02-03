import { Suspense } from "react"
import VendorPayoutsPage from "@/components/vendor/VendorPayoutsPage"

export default function VendorPayouts() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>}>
      <VendorPayoutsPage />
    </Suspense>
  )
}
