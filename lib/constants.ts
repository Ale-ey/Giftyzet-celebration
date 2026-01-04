import type { Product, Feature, WishlistType } from "@/types"
import { Shield, Zap, Heart, Users, Gift, Star, Calendar } from "lucide-react"

export const featuredProducts: Product[] = [
  {
    id: 1,
    name: "Samsung Galaxy Buds Pro",
    price: "$199.99",
    originalPrice: "$249.99",
    rating: 4.8,
    reviews: 2453,
    category: "Electronics",
    vendor: "Samsung",
    image: "https://images.unsplash.com/photo-1583394838494-d8c46b29b779?w=300&h=300&fit=crop",
    discount: "20% OFF"
  },
  {
    id: 2,
    name: "Premium Spa Day Package",
    price: "$159.99",
    originalPrice: "$199.99",
    rating: 4.9,
    reviews: 847,
    category: "Experiences",
    vendor: "Serenity Spa",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&fit=crop",
    discount: "Limited Time"
  },
  {
    id: 3,
    name: "Artisan Coffee Collection",
    price: "$89.99",
    originalPrice: "$109.99",
    rating: 4.7,
    reviews: 1234,
    category: "Food & Drink",
    vendor: "Local Roasters",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=300&h=300&fit=crop",
    discount: "18% OFF"
  },
  {
    id: 4,
    name: "House Cleaning Service",
    price: "$129.99",
    originalPrice: "$149.99",
    rating: 4.6,
    reviews: 945,
    category: "Services",
    vendor: "CleanCo",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop",
    discount: "First Time"
  }
]

export const features: Feature[] = [
  {
    icon: Shield,
    title: "Privacy First",
    description: "Recipients' addresses stay private. Send gifts without knowing personal details.",
    color: "text-primary"
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "From wishlist to doorstep in record time. Same-day delivery available.",
    color: "text-secondary"
  },
  {
    icon: Heart,
    title: "Thoughtful AI",
    description: "Smart recommendations based on occasions, relationships, and preferences.",
    color: "text-accent"
  },
  {
    icon: Users,
    title: "Group Gifting",
    description: "Pool money with friends and family for bigger, better gifts together.",
    color: "text-primary"
  },
  {
    icon: Gift,
    title: "Everything in One Place",
    description: "Products and services from Samsung, BestBuy, spas, and local businesses.",
    color: "text-secondary"
  },
  {
    icon: Star,
    title: "Wishlist Magic",
    description: "Hybrid wishlist system that adapts from everyday wants to life events.",
    color: "text-accent"
  }
]

export const wishlistTypes: WishlistType[] = [
  {
    type: "Birthday Wishlist",
    icon: Calendar,
    items: 12,
    contributors: 8,
    totalValue: "$450",
    progress: 65,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    type: "Wedding Registry",
    icon: Heart,
    items: 28,
    contributors: 45,
    totalValue: "$2,850",
    progress: 78,
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    type: "New Baby",
    icon: Gift,
    items: 15,
    contributors: 12,
    totalValue: "$680",
    progress: 42,
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  }
]

