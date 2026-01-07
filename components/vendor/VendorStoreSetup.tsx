"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Save, ArrowLeft, Upload, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getStoreByVendorId, saveStore } from "@/lib/vendor-data"
import { STORE_CATEGORIES } from "@/lib/constants"
import type { Store } from "@/types"

export default function VendorStoreSetup() {
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    email: "",
    logo: ""
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const { getVendors, saveVendor, saveStore } = require("@/lib/vendor-data")
    const vendors = getVendors()
    
    // Use first vendor if exists, or create a demo vendor
    let vendor = vendors[0]
    
    if (!vendor) {
      const vendorId = `vendor-${Date.now()}`
      vendor = {
        id: vendorId,
        email: "demo@vendor.com",
        name: "Demo Vendor",
        vendorName: "Demo Store",
        role: "vendor" as const,
        createdAt: new Date().toISOString()
      }
      saveVendor(vendor)
      
      // Create store with approved status for testing
      const store = {
        id: `store-${Date.now()}`,
        vendorId,
        name: "Demo Store",
        status: "approved" as const,
        createdAt: new Date().toISOString()
      }
      saveStore(store)
    }

    const vendorStore = getStoreByVendorId(vendor.id)
    if (!vendorStore) {
      // Create store if doesn't exist
      const store = {
        id: `store-${Date.now()}`,
        vendorId: vendor.id,
        name: vendor.vendorName,
        status: "approved" as const,
        createdAt: new Date().toISOString()
      }
      saveStore(store)
      setStore(store)
      setFormData({
        name: store.name || "",
        description: store.description || "",
        category: store.category || "",
        address: store.address || "",
        phone: store.phone || "",
        email: store.email || "",
        logo: store.logo || ""
      })
      setLogoPreview(store.logo || "")
    } else {
      setStore(vendorStore)
      setFormData({
        name: vendorStore.name || "",
        description: vendorStore.description || "",
        category: vendorStore.category || "",
        address: vendorStore.address || "",
        phone: vendorStore.phone || "",
        email: vendorStore.email || "",
        logo: vendorStore.logo || ""
      })
      setLogoPreview(vendorStore.logo || "")
    }
    setLoading(false)
  }, [router])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setFormData({ ...formData, logo: base64String })
      setLogoPreview(base64String)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo: "" })
    setLogoPreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return

    setSaving(true)
    const updatedStore: Store = {
      ...store,
      ...formData
    }
    saveStore(updatedStore)
    
    setTimeout(() => {
      setSaving(false)
      router.push("/vendor/dashboard")
    }, 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/vendor")}
          className="mb-6 text-gray-900 hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Setup</h1>
          <p className="text-gray-600 mb-8">Configure your store details and information</p>

          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Store Information</CardTitle>
              <CardDescription className="text-gray-600">
                Update your store details to help customers find and learn about your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-gray-900">
                    Store Name *
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white border-gray-200 text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-semibold text-gray-900">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-semibold text-gray-900">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    <option value="">Select a category</option>
                    {STORE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-semibold text-gray-900">
                    Address
                  </label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-white border-gray-200 text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                      Phone
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-gray-900">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="logo" className="text-sm font-semibold text-gray-900">
                    Store Logo
                  </label>
                  
                  {/* Logo Preview */}
                  {logoPreview && (
                    <div className="mb-4 relative inline-block">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </Button>
                    {logoPreview && (
                      <span className="text-sm text-gray-600">Logo uploaded</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload an image file (max 5MB). Supported formats: JPG, PNG, GIF
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/vendor")}
                    className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

