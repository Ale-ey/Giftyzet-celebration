"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, User, Store, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { signUp, getCurrentUser } from "@/lib/api/auth"
import { createVendor, createStore } from "@/lib/api/vendors"
import Link from "next/link"

export default function VendorSignUpPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    // Check if already logged in
    getCurrentUser()
      .then(async (user) => {
        if (user) {
          // Check store status and redirect accordingly
          try {
            const { getCurrentUserWithProfile } = await import("@/lib/api/auth")
            const { getVendorByUserId, getStoreByVendorId } = await import("@/lib/api/vendors")
            const userProfile = await getCurrentUserWithProfile()
            if (userProfile?.role === "vendor") {
              const vendor = await getVendorByUserId(user.id)
              if (vendor) {
                const store = await getStoreByVendorId(vendor.id)
                if (!store || store.status === "pending" || store.status === "rejected") {
                  router.push("/vendor/register-store")
                } else {
                  router.push("/vendor")
                }
              } else {
                router.push("/vendor/register-store")
              }
            } else {
              router.push("/vendor")
            }
          } catch {
            router.push("/vendor")
          }
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
    if (!vendorName.trim()) {
      setError("Business/Vendor name is required")
      setLoading(false)
      return
    }

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
      // Create user account
      const { user, needsEmailConfirmation } = await signUp({
        email,
        password,
        name,
        role: "vendor",
        vendor_name: vendorName
      })

      if (!user) {
        throw new Error("Failed to create user account")
      }

      if (needsEmailConfirmation) {
        // Email confirmation required - vendor will be created after confirmation via trigger
        setEmailSent(true)
        // Don't redirect, show email confirmation message
        return
      }

      // Email confirmation disabled - create vendor immediately
      try {
        // Create vendor profile
        const vendor = await createVendor(user.id, {
          vendor_name: vendorName,
          business_name: businessName || vendorName,
          email: email,
          phone: phone || undefined,
          address: address || undefined
        })

        // Create store with pending status
        await createStore(vendor.id, {
          name: vendorName,
          description: `Store for ${vendorName}`,
          address: address || undefined,
          phone: phone || undefined,
          email: email
        })

        setSuccess(true)
        window.dispatchEvent(new Event("authUpdated"))
        
        // Redirect to store registration after a short delay
        setTimeout(() => {
        router.push("/vendor/register-store")
      }, 2000)
      } catch (vendorError: any) {
        // If vendor creation fails, still show email confirmation
        // Vendor can be created after email confirmation
        console.warn("Vendor creation failed, will be created after email confirmation:", vendorError)
        setEmailSent(true)
      }
    } catch (err: any) {
      console.error("Vendor sign up error:", err)
      setError(err.message || "Failed to create vendor account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border-2 border-primary">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-4">
              We've sent a confirmation email to <strong>{email}</strong>. 
              Please check your inbox and click the confirmation link to activate your vendor account.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              After confirming your email, your vendor profile and store will be created automatically.
            </p>
            <Link href="/">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full border-2 border-primary">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Account Created!</h2>
            <p className="text-gray-600 mb-4">
              Your vendor account has been created. Please complete your store registration to start selling.
              Redirecting to store registration...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign Up as Vendor</h1>
              <p className="text-gray-600">
                Join as a vendor to sell your products and services. Your store will be reviewed before going live.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-gray-900">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
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
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="vendorName" className="text-sm font-semibold text-gray-900">
                    Business/Vendor Name *
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="vendorName"
                      type="text"
                      placeholder="Your business name"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="businessName" className="text-sm font-semibold text-gray-900">
                    Legal Business Name
                  </label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Legal business name (optional)"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-semibold text-gray-900">
                    Business Address
                  </label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Business address (optional)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-gray-900">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 6 characters"
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
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
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
                    Creating vendor account...
                  </>
                ) : (
                  "Sign Up as Vendor"
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
              <p className="text-sm text-center text-gray-600 mt-2">
                Want to sign up as a regular user?{" "}
                <Link
                  href="/auth/signup"
                  className="text-primary hover:text-primary/80 font-semibold"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

