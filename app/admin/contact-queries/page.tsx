import type { Metadata } from "next"
import { Suspense } from "react"
import AdminContactQueriesPage from "@/components/admin/AdminContactQueriesPage"

export const metadata: Metadata = {
  title: "Contact Queries | Admin",
  description: "View contact form submissions.",
}

export default function AdminContactQueriesRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>}>
      <AdminContactQueriesPage />
    </Suspense>
  )
}
