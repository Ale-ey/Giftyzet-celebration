"use client"

import { useState, useEffect } from "react"
import { MapPin, Phone, User, Gift, Package, CreditCard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Product, Service } from "@/types"

interface CartItem extends (Product | Service) {
  quantity: number
  type: "product" | "service"
}

interface OrderConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (orderData: OrderData) => void
  cartItems: CartItem[]
  orderType: "self" | "gift"
}

export interface OrderData {
  senderName: string
  senderEmail: string
  senderPhone: string
  senderAddress: string
  receiverName?: string
  receiverEmail?: string
  receiverPhone?: string
  receiverAddress?: string
  orderType: "self" | "gift"
}

export default function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  cartItems,
  orderType
}: OrderConfirmationModalProps) {
  const [formData, setFormData] = useState<OrderData>({
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    senderAddress: "",
    receiverName: "",
    receiverEmail: "",
    receiverPhone: "",
    receiverAddress: "",
    orderType: orderType
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load user profile if logged in
      const authData = localStorage.getItem("auth")
      const profileData = authData ? localStorage.getItem(`profile_${JSON.parse(authData).email}`) : null
      
      if (authData && profileData) {
        try {
          const auth = JSON.parse(authData)
          const profile = JSON.parse(profileData)
          
          setFormData(prev => ({
            ...prev,
            senderName: auth.name || auth.email?.split("@")[0] || "",
            senderEmail: auth.email || "",
            senderPhone: profile.phoneNumber || "",
            senderAddress: profile.address || ""
          }))
        } catch (e) {
          console.error("Error loading profile:", e)
        }
      } else {
        // Reset form for non-logged-in users
        setFormData({
          senderName: "",
          senderEmail: "",
          senderPhone: "",
          senderAddress: "",
          receiverName: "",
          receiverEmail: "",
          receiverPhone: "",
          receiverAddress: "",
          orderType: orderType
        })
      }
    }
  }, [isOpen, orderType])

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace("$", ""))
      return total + price * item.quantity
    }, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.senderName || !formData.senderEmail || !formData.senderPhone || !formData.senderAddress) {
      alert("Please fill in all required sender fields")
      return
    }

    if (orderType === "gift") {
      if (!formData.receiverName || !formData.receiverEmail || !formData.receiverPhone || !formData.receiverAddress) {
        alert("Please fill in all required receiver fields for gift orders")
        return
      }
    }

    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      onConfirm(formData)
      setLoading(false)
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {orderType === "gift" ? (
              <>
                <Gift className="h-6 w-6 text-primary" />
                Send as Gift
              </>
            ) : (
              <>
                <Package className="h-6 w-6 text-primary" />
                Order Confirmation
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {orderType === "gift" 
              ? "Fill in sender and receiver details to send this as a gift"
              : "Review your order details and confirm shipping information"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${(parseFloat(item.price.replace("$", "")) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              {orderType === "gift" ? "Sender Information" : "Your Information"}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="senderName" className="text-sm font-semibold text-gray-900">
                    Full Name *
                  </label>
                  <Input
                    id="senderName"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    required
                    className="bg-white border-gray-200 text-gray-900"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="senderEmail" className="text-sm font-semibold text-gray-900">
                    Email *
                  </label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={formData.senderEmail}
                    onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                    required
                    className="bg-white border-gray-200 text-gray-900"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="senderPhone" className="text-sm font-semibold text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Phone Number *
                </label>
                <Input
                  id="senderPhone"
                  type="tel"
                  value={formData.senderPhone}
                  onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                  required
                  className="bg-white border-gray-200 text-gray-900"
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="senderAddress" className="text-sm font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Address *
                </label>
                <textarea
                  id="senderAddress"
                  value={formData.senderAddress}
                  onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  placeholder="Enter your complete address"
                />
              </div>
            </div>
          </div>

          {/* Receiver Information (for gift orders) */}
          {orderType === "gift" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Gift className="h-5 w-5 mr-2 text-primary" />
                Receiver Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="receiverName" className="text-sm font-semibold text-gray-900">
                      Receiver Name *
                    </label>
                    <Input
                      id="receiverName"
                      value={formData.receiverName}
                      onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                      required
                      className="bg-white border-gray-200 text-gray-900"
                      placeholder="Enter receiver's full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="receiverEmail" className="text-sm font-semibold text-gray-900">
                      Receiver Email *
                    </label>
                    <Input
                      id="receiverEmail"
                      type="email"
                      value={formData.receiverEmail}
                      onChange={(e) => setFormData({ ...formData, receiverEmail: e.target.value })}
                      required
                      className="bg-white border-gray-200 text-gray-900"
                      placeholder="Enter receiver's email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="receiverPhone" className="text-sm font-semibold text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Receiver Phone Number *
                  </label>
                  <Input
                    id="receiverPhone"
                    type="tel"
                    value={formData.receiverPhone}
                    onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                    required
                    className="bg-white border-gray-200 text-gray-900"
                    placeholder="Enter receiver's phone number"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="receiverAddress" className="text-sm font-semibold text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Receiver Address *
                  </label>
                  <textarea
                    id="receiverAddress"
                    value={formData.receiverAddress}
                    onChange={(e) => setFormData({ ...formData, receiverAddress: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder="Enter receiver's complete address"
                  />
                  <p className="text-xs text-gray-500">
                    After payment, you'll receive a link to share with the receiver to confirm their address
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

