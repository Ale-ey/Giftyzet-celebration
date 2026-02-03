"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Confirming your email...")

  useEffect(() => {
    const code = searchParams.get("code")
    const next = searchParams.get("next") || "/"
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    if (error) {
      setStatus("error")
      setMessage(errorDescription || error || "Something went wrong.")
      return
    }

    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (error) {
            setStatus("error")
            setMessage(error.message || "Failed to confirm email.")
            return
          }
          setStatus("success")
          setMessage("Email confirmed! Redirecting...")
          router.replace(next)
        })
        .catch(() => {
          setStatus("error")
          setMessage("Failed to confirm email. Please try again.")
        })
      return
    }

    // Hash fragment (implicit flow): Supabase client may have already set the session on load
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    if (hash) {
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session) {
            setStatus("success")
            setMessage("Email confirmed! Redirecting...")
            router.replace(next)
          } else {
            setStatus("error")
            setMessage("Could not complete sign in. Please try the link again.")
          }
        })
      return
    }

    setStatus("error")
    setMessage("Invalid confirmation link. No code or token found.")
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        {status === "loading" && (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-gray-700">{message}</p>
          </>
        )}
        {status === "success" && (
          <p className="text-green-700 font-medium">{message}</p>
        )}
        {status === "error" && (
          <>
            <p className="text-red-600 font-medium mb-4">{message}</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-primary underline"
            >
              Go to home
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
