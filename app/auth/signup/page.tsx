"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, User, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { signUp, getCurrentUser } from "@/lib/api/auth"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Check if already logged in
    getCurrentUser()
      .then((user) => {
        if (user) {
          router.push("/profile")
        }
      })
      .catch(() => {
        // Not logged in, continue
      })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const { user, needsEmailConfirmation } = await signUp({
        email,
        password,
        name,
        role: "user"
      })
      
      if (user) {
        if (needsEmailConfirmation) {
          // Show email confirmation message
          setSuccess(true)
          // Don't redirect, show success message
        } else {
          setSuccess(true)
          window.dispatchEvent(new Event("authUpdated"))
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push("/profile")
          }, 2000)
        }
      }
    } catch (err: any) {
      console.error("Sign up error:", err)
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border-2 border-primary">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
            <p className="text-gray-600 mb-4">
              Your account has been successfully created. Redirecting to your profile...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-gray-200">
          <CardContent className="p-8">
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign Up</h1>
              <p className="text-gray-600">Create a new account to start gifting.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-gray-900">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-900">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-900">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-center text-gray-600">
                Already have an account?{" "}
                <span className="text-primary font-semibold">
                  Use the Sign In button in the header
                </span>
              </p>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 uppercase">or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <Link href="/auth/vendor/signup">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                >
                  Sign Up as Vendor
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

