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
            setMessage(error.message || "Could not complete sign in. Please try the link again.")
            return
          }
          setStatus("success")
          setMessage("Email confirmed! Redirecting...")
          router.replace(next)
        })
        .catch((err) => {
          setStatus("error")
          setMessage(err?.message || "Could not complete sign in. Please try the link again.")
        })
      return
    }

    // Hash fragment (implicit flow): parse tokens from hash and set session explicitly
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    if (hash) {
      const params = new URLSearchParams(hash.replace(/^#/, ""))
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")

      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data, error }) => {
            if (error) {
              setStatus("error")
              setMessage(error.message || "Could not complete sign in. Please try the link again.")
              return
            }
            setStatus("success")
            setMessage("Email confirmed! Redirecting...")
            // Clear hash from URL and redirect
            if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname + window.location.search)
            router.replace(next)
          })
          .catch((err) => {
            setStatus("error")
            setMessage(err?.message || "Could not complete sign in. Please try the link again.")
          })
        return
      }

      // Hash present but no tokens: wait briefly for client to process, then check session
      const checkSession = () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setStatus("success")
            setMessage("Email confirmed! Redirecting...")
            if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname + window.location.search)
            router.replace(next)
          } else {
            setStatus("error")
            setMessage("Could not complete sign in. Please try the link again.")
          }
        })
      }
      setTimeout(checkSession, 800)
      return
    }

    // No code and no hash: maybe already confirmed or wrong URL. Check for existing session once.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("success")
        setMessage("You're already signed in. Redirecting...")
        router.replace(next)
      } else {
        setStatus("error")
        setMessage("Invalid or expired confirmation link. The link may have been used already or the redirect URL might not be set in Supabase.")
      }
    })
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
            <p className="text-sm text-gray-600 mb-4">
              If you already confirmed your email, go home and sign in with your password.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-primary font-medium underline hover:no-underline"
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
