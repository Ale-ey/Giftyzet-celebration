import type { Product, Feature, WishlistType, Service } from "@/types"
import { Shield, Zap, Heart, Users, Gift, Star, Calendar } from "lucide-react"

// Extended products list - centralized product data
const extendedProducts: Product[] = [
  {
    id: 5,
    name: "Wireless Headphones",
    price: "$79.99",
    originalPrice: "$99.99",
    rating: 4.5,
    reviews: 892,
    category: "Electronics",
    vendor: "TechBrand",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
    discount: "20% OFF",
    description: "Comfortable over-ear headphones with excellent sound quality and long battery life. Perfect for daily commutes, workouts, or relaxing at home."
  },
  {
    id: 6,
    name: "Facial Treatment",
    price: "$89.99",
    originalPrice: "$120.00",
    rating: 4.7,
    reviews: 456,
    category: "Beauty & Wellness",
    vendor: "Glow Spa",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop",
    discount: "25% OFF",
    description: "Rejuvenating facial treatment using premium skincare products. Deep cleansing, exfoliation, and hydration to leave your skin glowing and refreshed."
  },
  {
    id: 7,
    name: "Gourmet Dinner for Two",
    price: "$149.99",
    originalPrice: "$199.99",
    rating: 4.9,
    reviews: 1234,
    category: "Food & Experiences",
    vendor: "Fine Dining Co",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop",
    discount: "Limited Time",
    description: "An exquisite dining experience featuring a multi-course meal prepared by award-winning chefs. Perfect for special occasions and romantic evenings."
  },
  {
    id: 8,
    name: "Home Organization Service",
    price: "$199.99",
    originalPrice: "$249.99",
    rating: 4.6,
    reviews: 678,
    category: "Home Services",
    vendor: "OrganizePro",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
    discount: "First Time",
    description: "Professional home organization service to declutter and organize your living spaces. Create a more functional and peaceful home environment."
  },
  {
    id: 9,
    name: "Handmade Ceramic Set",
    price: "$59.99",
    originalPrice: "$79.99",
    rating: 4.8,
    reviews: 345,
    category: "Local Artisans",
    vendor: "Artisan Crafts",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68581?w=300&h=300&fit=crop",
    discount: "25% OFF",
    description: "Beautiful handcrafted ceramic dinnerware set featuring unique designs. Each piece is carefully made by skilled artisans, adding elegance to your table."
  },
  {
    id: 10,
    name: "Smart Watch",
    price: "$299.99",
    originalPrice: "$349.99",
    rating: 4.6,
    reviews: 2134,
    category: "Electronics",
    vendor: "TechBrand",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
    discount: "14% OFF",
    description: "Feature-rich smartwatch with fitness tracking, heart rate monitoring, and smartphone connectivity. Stay connected and healthy on the go."
  },
  {
    id: 11,
    name: "Yoga Class Package",
    price: "$99.99",
    originalPrice: "$129.99",
    rating: 4.7,
    reviews: 567,
    category: "Beauty & Wellness",
    vendor: "Zen Studio",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop",
    discount: "23% OFF",
    description: "A package of 10 yoga classes suitable for all levels. Improve flexibility, strength, and mental well-being in a peaceful studio environment."
  },
  {
    id: 12,
    name: "Cooking Class Experience",
    price: "$119.99",
    originalPrice: "$149.99",
    rating: 4.8,
    reviews: 789,
    category: "Food & Experiences",
    vendor: "Culinary Academy",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop",
    discount: "20% OFF",
    description: "Learn to cook like a pro in this hands-on cooking class. Master new techniques and recipes while enjoying a fun and educational experience."
  }
]

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
    discount: "20% OFF",
    description: "Premium wireless earbuds with active noise cancellation, crystal-clear sound quality, and all-day comfort. Perfect for music lovers and professionals on the go."
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
    discount: "Limited Time",
    description: "A luxurious full-day spa experience including massage, facial treatment, aromatherapy, and access to premium facilities. The perfect gift for relaxation and rejuvenation."
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
    discount: "18% OFF",
    description: "Curated selection of premium single-origin coffee beans from around the world. Each bag is carefully roasted to perfection, delivering rich flavors and aromatic notes."
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
    discount: "First Time",
    description: "Professional deep cleaning service for your entire home. Our experienced team uses eco-friendly products to leave your space spotless and fresh."
  }
]

// All products combined - centralized product data
export const allProducts: Product[] = [
  ...featuredProducts,
  ...extendedProducts
]

// Helper function to get product by ID
export function getProductById(id: number): Product | undefined {
  return allProducts.find((p) => p.id === id)
}

// Services data - separate from products
export const allServices: Service[] = [
  {
    id: 101,
    name: "Premium Spa Day Package",
    price: "$159.99",
    originalPrice: "$199.99",
    rating: 4.9,
    reviews: 847,
    category: "Beauty & Wellness",
    vendor: "Serenity Spa",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&fit=crop",
    discount: "Limited Time",
    description: "A luxurious full-day spa experience including massage, facial treatment, aromatherapy, and access to premium facilities. The perfect gift for relaxation and rejuvenation.",
    location: "On-site"
  },
  {
    id: 102,
    name: "House Cleaning Service",
    price: "$129.99",
    originalPrice: "$149.99",
    rating: 4.6,
    reviews: 945,
    category: "Home Services",
    vendor: "CleanCo",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop",
    discount: "First Time",
    description: "Professional deep cleaning service for your entire home. Our experienced team uses eco-friendly products to leave your space spotless and fresh.",
    location: "At your location"
  },
  {
    id: 103,
    name: "Home Organization Service",
    price: "$199.99",
    originalPrice: "$249.99",
    rating: 4.6,
    reviews: 678,
    category: "Home Services",
    vendor: "OrganizePro",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
    discount: "First Time",
    description: "Professional home organization service to declutter and organize your living spaces. Create a more functional and peaceful home environment.",
    location: "At your location"
  },
  {
    id: 104,
    name: "Facial Treatment",
    price: "$89.99",
    originalPrice: "$120.00",
    rating: 4.7,
    reviews: 456,
    category: "Beauty & Wellness",
    vendor: "Glow Spa",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop",
    discount: "25% OFF",
    description: "Rejuvenating facial treatment using premium skincare products. Deep cleansing, exfoliation, and hydration to leave your skin glowing and refreshed.",
    location: "On-site"
  },
  {
    id: 105,
    name: "Yoga Class Package",
    price: "$99.99",
    originalPrice: "$129.99",
    rating: 4.7,
    reviews: 567,
    category: "Beauty & Wellness",
    vendor: "Zen Studio",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop",
    discount: "23% OFF",
    description: "A package of 10 yoga classes suitable for all levels. Improve flexibility, strength, and mental well-being in a peaceful studio environment.",
    location: "On-site"
  },
  {
    id: 106,
    name: "Cooking Class Experience",
    price: "$119.99",
    originalPrice: "$149.99",
    rating: 4.8,
    reviews: 789,
    category: "Food & Experiences",
    vendor: "Culinary Academy",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop",
    discount: "20% OFF",
    description: "Learn to cook like a pro in this hands-on cooking class. Master new techniques and recipes while enjoying a fun and educational experience.",
    location: "On-site"
  },
  {
    id: 107,
    name: "Gourmet Dinner for Two",
    price: "$149.99",
    originalPrice: "$199.99",
    rating: 4.9,
    reviews: 1234,
    category: "Food & Experiences",
    vendor: "Fine Dining Co",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop",
    discount: "Limited Time",
    description: "An exquisite dining experience featuring a multi-course meal prepared by award-winning chefs. Perfect for special occasions and romantic evenings.",
    location: "Restaurant"
  },
  {
    id: 108,
    name: "Personal Training Session",
    price: "$79.99",
    originalPrice: "$99.99",
    rating: 4.8,
    reviews: 432,
    category: "Beauty & Wellness",
    vendor: "FitLife Gym",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
    discount: "20% OFF",
    description: "One-on-one personal training session with certified fitness professionals. Customized workout plans to help you reach your fitness goals.",
    location: "Gym or Home"
  },
  {
    id: 109,
    name: "Pet Grooming Service",
    price: "$49.99",
    originalPrice: "$69.99",
    rating: 4.7,
    reviews: 321,
    category: "Pet Services",
    vendor: "PawSpa",
    image: "https://images.unsplash.com/photo-1551717743-49959800b1f6?w=300&h=300&fit=crop",
    discount: "28% OFF",
    description: "Professional pet grooming service including bath, haircut, nail trimming, and ear cleaning. Your furry friend will look and feel amazing.",
    location: "On-site or Mobile"
  },
  {
    id: 110,
    name: "Landscaping Service",
    price: "$299.99",
    originalPrice: "$399.99",
    rating: 4.6,
    reviews: 234,
    category: "Home Services",
    vendor: "GreenThumb Landscaping",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop",
    discount: "25% OFF",
    description: "Professional landscaping service to transform your outdoor space. Includes design consultation, planting, and maintenance.",
    location: "At your location"
  },
  {
    id: 111,
    name: "Massage Therapy Session",
    price: "$89.99",
    originalPrice: "$119.99",
    rating: 4.9,
    reviews: 567,
    category: "Beauty & Wellness",
    vendor: "Serenity Spa",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&fit=crop",
    discount: "25% OFF",
    description: "Relaxing full-body massage therapy session to relieve stress and tension. Choose from Swedish, deep tissue, or hot stone massage.",
    location: "On-site"
  },
  {
    id: 112,
    name: "Photography Session",
    price: "$199.99",
    originalPrice: "$249.99",
    rating: 4.8,
    reviews: 456,
    category: "Photography",
    vendor: "Capture Moments",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&h=300&fit=crop",
    discount: "20% OFF",
    description: "Professional photography session for portraits, events, or special occasions. Includes edited digital photos and print options.",
    location: "On-location"
  }
]

// Helper function to get service by ID
export function getServiceById(id: number): Service | undefined {
  return allServices.find((s) => s.id === id)
}

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

// Centralized categories list
export const STORE_CATEGORIES = [
  "Electronics",
  "Beauty & Wellness",
  "Food & Experiences",
  "Home Services",
  "Local Artisans",
  "Fashion & Apparel",
  "Health & Fitness",
  "Photography",
  "Pet Services",
  "Education & Training",
  "Entertainment",
  "Automotive",
  "Travel & Tourism",
  "Other"
]

