export interface Product {
  id: number
  name: string
  price: string
  originalPrice: string
  rating: number
  reviews: number
  category: string
  vendor: string
  image: string
  discount: string
  description?: string
  stock?: number
  available?: boolean
}

export interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
}

export interface WishlistType {
  type: string
  icon: React.ComponentType<{ className?: string }>
  items: number
  contributors: number
  totalValue: string
  progress: number
  color: string
  bgColor: string
}

export interface Service {
  id: number
  name: string
  price: string
  originalPrice: string
  rating: number
  reviews: number
  category: string
  vendor: string
  image: string
  discount: string
  description?: string
  duration?: string
  location?: string
  available?: boolean
}

export interface Vendor {
  id: string
  email: string
  name: string
  vendorName: string
  role: "vendor"
  createdAt: string
}

export interface Store {
  id: string
  vendorId: string
  name: string
  description?: string
  status: "pending" | "approved" | "suspended"
  category?: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  createdAt: string
  approvedAt?: string
  suspendedAt?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerEmail: string
  customerName: string
  items: OrderItem[]
  total: number
  status: "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled"
  vendorId: string
  vendorName: string
  createdAt: string
  confirmedAt?: string
  dispatchedAt?: string
  deliveredAt?: string
  shippingAddress?: string
  orderType?: "self" | "gift"
  senderAddress?: string
  receiverAddress?: string
}

export interface OrderItem {
  id: number
  name: string
  price: string
  quantity: number
  type: "product" | "service"
  image?: string
}

