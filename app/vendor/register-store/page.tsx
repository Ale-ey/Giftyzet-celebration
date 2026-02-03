import { Suspense } from "react"
import StoreRegistrationPage from "@/components/vendor/StoreRegistrationPage"

export default function RegisterStorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>}>
      <StoreRegistrationPage />
    </Suspense>
  )
}

