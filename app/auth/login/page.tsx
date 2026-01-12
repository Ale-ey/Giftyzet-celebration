"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/api/auth"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in, redirect to marketplace
    getCurrentUser()
      .then((user) => {
        if (user) {
          // Redirect to marketplace after login
          router.push("/marketplace")
        } else {
          // Not logged in, redirect to home where modal can be opened
          router.push("/")
        }
      })
      .catch(() => {
        // Not logged in, redirect to home
        router.push("/")
      })
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}

