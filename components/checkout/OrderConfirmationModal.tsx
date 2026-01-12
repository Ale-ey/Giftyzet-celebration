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
import { useToast } from "@/components/ui/toast"
import { getCurrentUser } from "@/lib/api/auth"
import { getStripe } from "@/lib/stripe/client"
import type { Product, Service } from "@/types"

type CartItem = (Product | Service) & {
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
  giftLinkDeliveryMethod?: "email" | "sms" | "copy"
}

export default function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  cartItems,
  orderType
}: OrderConfirmationModalProps) {
  const { showToast } = useToast()
  const [isGiftToMyself, setIsGiftToMyself] = useState(true)
  const [giftLinkDeliveryMethod, setGiftLinkDeliveryMethod] = useState<"email" | "sms" | "copy">("email")
  const [formData, setFormData] = useState<OrderData>({
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    senderAddress: "",
    receiverName: "",
    receiverEmail: "",
    receiverPhone: "",
    receiverAddress: "",
    orderType: "self",
    giftLinkDeliveryMethod: "email"
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset checkbox to default
      setIsGiftToMyself(true)
      
      // Load user profile if logged in
      async function loadUserProfile() {
        try {
          const user = await getCurrentUser()
          if (user) {
            // Try to get profile from Supabase
            const authData = localStorage.getItem("auth")
            const profileData = authData ? localStorage.getItem(`profile_${JSON.parse(authData).email}`) : null
            
            if (authData) {
              const auth = JSON.parse(authData)
              const profile = profileData ? JSON.parse(profileData) : {}
              
              setFormData(prev => ({
                ...prev,
                senderName: auth.name || user.user_metadata?.name || user.email?.split("@")[0] || "",
                senderEmail: user.email || "",
                senderPhone: profile.phoneNumber || user.user_metadata?.phone || "",
                senderAddress: profile.address || user.user_metadata?.address || "",
                orderType: "self"
              }))
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
              orderType: "self"
            })
          }
        } catch (e) {
          console.error("Error loading profile:", e)
          // Reset form on error
          setFormData({
            senderName: "",
            senderEmail: "",
            senderPhone: "",
            senderAddress: "",
            receiverName: "",
            receiverEmail: "",
            receiverPhone: "",
            receiverAddress: "",
            orderType: "self"
          })
        }
      }
      
      loadUserProfile()
    }
  }, [isOpen])

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.price === 'string' 
        ? parseFloat(item.price.replace("$", ""))
        : parseFloat(String(item.price))
      return total + (isNaN(price) ? 0 : price) * item.quantity
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation - Sender fields
    if (!formData.senderName || !formData.senderEmail || !formData.senderPhone || !formData.senderAddress) {
      showToast("Please fill in all your information fields", "error")
      return
    }

    // If not gift to myself, validate receiver fields based on delivery method
    if (!isGiftToMyself) {
      if (!formData.receiverName) {
        showToast("Please provide receiver's name", "error")
        return
      }
      
      if (giftLinkDeliveryMethod === 'email' && !formData.receiverEmail) {
        showToast("Please provide receiver's email address", "error")
        return
      }
      
      if (giftLinkDeliveryMethod === 'sms' && !formData.receiverPhone) {
        showToast("Please provide receiver's phone number", "error")
        return
      }
    }

    setLoading(true)
    
    try {
      // Update order type based on checkbox
      const orderDataToSubmit: OrderData = {
        ...formData,
        orderType: isGiftToMyself ? "self" : "gift",
        giftLinkDeliveryMethod: isGiftToMyself ? undefined : giftLinkDeliveryMethod
      }
      
      // Call the onConfirm callback to create the order first
      // This will return the order data that we need for Stripe
      await onConfirm(orderDataToSubmit)
    } catch (error: any) {
      console.error('Error during checkout:', error)
      showToast(error.message || "Failed to process checkout", "error")
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Order Confirmation
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Review your order details and confirm contact information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2">
              {cartItems.map((item, idx) => {
                const price = typeof item.price === 'string' 
                  ? parseFloat(item.price.replace("$", ""))
                  : parseFloat(String(item.price))
                return (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${((isNaN(price) ? 0 : price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                )
              })}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gift to Myself Checkbox */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isGiftToMyself}
                onChange={(e) => {
                  setIsGiftToMyself(e.target.checked)
                  // Clear receiver fields when switching to self
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      receiverName: "",
                      receiverEmail: "",
                      receiverPhone: "",
                      receiverAddress: "",
                      orderType: "self"
                    }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      orderType: "gift"
                    }))
                  }
                }}
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
              />
              <span className="ml-3 text-base font-semibold text-gray-900">
                This order is for myself
              </span>
            </label>
            <p className="ml-8 mt-1 text-sm text-gray-600">
              {isGiftToMyself 
                ? "The order will be delivered to your address" 
                : "You're sending this as a gift - the receiver will confirm their address via a link"}
            </p>
          </div>

          {/* Sender Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Your Information
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
          {!isGiftToMyself && (
            <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Gift className="h-5 w-5 mr-2 text-primary" />
                Gift Receiver Information
              </h3>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  🎁 <strong>Privacy Protected:</strong> You only need to provide the receiver's name and contact.
                </p>
                <p className="text-xs text-yellow-700">
                  After payment, we'll send them a secure gift link to fill in their shipping address privately. You won't see their address.
                </p>
              </div>
              
              {/* Delivery Method Selector */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-900 block mb-3">
                  How would you like to share the gift link? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Email Option */}
                  <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    giftLinkDeliveryMethod === 'email' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="email"
                      checked={giftLinkDeliveryMethod === 'email'}
                      onChange={(e) => {
                        setGiftLinkDeliveryMethod('email')
                        setFormData({ ...formData, giftLinkDeliveryMethod: 'email' })
                      }}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">📧</span>
                        <span className="font-semibold text-gray-900">Email</span>
                      </div>
                      <p className="text-xs text-gray-600">We'll email them automatically</p>
                    </div>
                  </label>
                  
                  {/* SMS Option */}
                  <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    giftLinkDeliveryMethod === 'sms' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="sms"
                      checked={giftLinkDeliveryMethod === 'sms'}
                      onChange={(e) => {
                        setGiftLinkDeliveryMethod('sms')
                        setFormData({ ...formData, giftLinkDeliveryMethod: 'sms' })
                      }}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">📱</span>
                        <span className="font-semibold text-gray-900">SMS/Text</span>
                      </div>
                      <p className="text-xs text-gray-600">We'll text them the link</p>
                    </div>
                  </label>
                  
                  {/* Copy Link Option */}
                  <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    giftLinkDeliveryMethod === 'copy' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="copy"
                      checked={giftLinkDeliveryMethod === 'copy'}
                      onChange={(e) => {
                        setGiftLinkDeliveryMethod('copy')
                        setFormData({ ...formData, giftLinkDeliveryMethod: 'copy' })
                      }}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🔗</span>
                        <span className="font-semibold text-gray-900">Copy Link</span>
                      </div>
                      <p className="text-xs text-gray-600">You'll share it yourself</p>
                    </div>
                  </label>
                </div>
              </div>
              
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
                      required={!isGiftToMyself}
                      className="bg-white border-gray-200 text-gray-900"
                      placeholder="Enter receiver's full name"
                    />
                  </div>
                  
                  {/* Conditional Email/Phone field based on delivery method */}
                  {giftLinkDeliveryMethod === 'email' && (
                    <div className="space-y-2">
                      <label htmlFor="receiverEmail" className="text-sm font-semibold text-gray-900">
                        Receiver Email *
                      </label>
                      <Input
                        id="receiverEmail"
                        type="email"
                        value={formData.receiverEmail}
                        onChange={(e) => setFormData({ ...formData, receiverEmail: e.target.value })}
                        required={!isGiftToMyself && giftLinkDeliveryMethod === 'email'}
                        className="bg-white border-gray-200 text-gray-900"
                        placeholder="Enter receiver's email"
                      />
                    </div>
                  )}
                  
                  {giftLinkDeliveryMethod === 'sms' && (
                    <div className="space-y-2">
                      <label htmlFor="receiverPhone" className="text-sm font-semibold text-gray-900">
                        Receiver Phone *
                      </label>
                      <Input
                        id="receiverPhone"
                        type="tel"
                        value={formData.receiverPhone}
                        onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                        required={!isGiftToMyself && giftLinkDeliveryMethod === 'sms'}
                        className="bg-white border-gray-200 text-gray-900"
                        placeholder="Enter receiver's phone number"
                      />
                    </div>
                  )}
                  
                  {giftLinkDeliveryMethod === 'copy' && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900">
                        Contact Info
                      </label>
                      <div className="bg-gray-100 border border-gray-200 rounded-md p-3 text-sm text-gray-600">
                        You'll receive the link after payment to share however you like
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>What happens next:</strong>
                  </p>
                  <ol className="text-xs text-blue-700 mt-1 ml-4 list-decimal space-y-0.5">
                    <li>You complete payment</li>
                    <li>
                      {giftLinkDeliveryMethod === 'email' && 'We email the receiver a secure gift link'}
                      {giftLinkDeliveryMethod === 'sms' && 'We text the receiver a secure gift link'}
                      {giftLinkDeliveryMethod === 'copy' && 'You get the gift link to share yourself'}
                    </li>
                    <li>They fill in their shipping address and phone</li>
                    <li>Order ships to their address (kept private from you)</li>
                  </ol>
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

