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

