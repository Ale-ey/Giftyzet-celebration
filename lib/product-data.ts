"use client"

import type { Product, Service } from "@/types"

// Product data management
export const getVendorProducts = (): Product[] => {
  if (typeof window === "undefined") return []
  const products = localStorage.getItem("vendorProducts")
  return products ? JSON.parse(products) : []
}

export const saveVendorProduct = (product: Product): void => {
  if (typeof window === "undefined") return
  const products = getVendorProducts()
  const existingIndex = products.findIndex((p) => p.id === product.id)
  if (existingIndex >= 0) {
    products[existingIndex] = product
  } else {
    products.push(product)
  }
  localStorage.setItem("vendorProducts", JSON.stringify(products))
  window.dispatchEvent(new Event("vendorProductsUpdated"))
}

export const deleteVendorProduct = (productId: number): void => {
  if (typeof window === "undefined") return
  const products = getVendorProducts()
  const filtered = products.filter((p) => p.id !== productId)
  localStorage.setItem("vendorProducts", JSON.stringify(filtered))
  window.dispatchEvent(new Event("vendorProductsUpdated"))
}

// Service data management
export const getVendorServices = (): Service[] => {
  if (typeof window === "undefined") return []
  const services = localStorage.getItem("vendorServices")
  return services ? JSON.parse(services) : []
}

export const saveVendorService = (service: Service): void => {
  if (typeof window === "undefined") return
  const services = getVendorServices()
  const existingIndex = services.findIndex((s) => s.id === service.id)
  if (existingIndex >= 0) {
    services[existingIndex] = service
  } else {
    services.push(service)
  }
  localStorage.setItem("vendorServices", JSON.stringify(services))
  window.dispatchEvent(new Event("vendorServicesUpdated"))
}

export const deleteVendorService = (serviceId: number): void => {
  if (typeof window === "undefined") return
  const services = getVendorServices()
  const filtered = services.filter((s) => s.id !== serviceId)
  localStorage.setItem("vendorServices", JSON.stringify(filtered))
  window.dispatchEvent(new Event("vendorServicesUpdated"))
}

// Initialize dummy vendor products for a specific vendor
export const initializeDummyVendorProducts = (vendorName?: string): void => {
  if (typeof window === "undefined") return
  
  // If vendorName is provided, check if that vendor already has products
  if (vendorName) {
    const existingProducts = getVendorProducts()
    const vendorProducts = existingProducts.filter((p) => p.vendor === vendorName)
    if (vendorProducts.length > 0) {
      // Vendor already has products, don't overwrite
      return
    }
  } else {
    // Check if any vendor products exist
    const existingProducts = getVendorProducts()
    if (existingProducts.length > 0) {
      // Don't overwrite existing data
      return
    }
  }

  const dummyProducts: Product[] = [
    // TechBrand Products
    {
      id: 1001,
      name: "Premium Wireless Earbuds Pro",
      price: "$129.99",
      originalPrice: "$159.99",
      rating: 4.8,
      reviews: 1245,
      category: "Electronics",
      vendor: "TechBrand",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop",
      discount: "19% OFF",
      description: "High-quality wireless earbuds with active noise cancellation and 30-hour battery life.",
      stock: 50
    },
    {
      id: 1002,
      name: "Smart Fitness Tracker",
      price: "$89.99",
      originalPrice: "$119.99",
      rating: 4.6,
      reviews: 892,
      category: "Electronics",
      vendor: "TechBrand",
      image: "https://images.unsplash.com/photo-1579586337278-3befd40e237a?w=300&h=300&fit=crop",
      discount: "25% OFF",
      description: "Track your fitness goals with heart rate monitoring, sleep tracking, and GPS.",
      stock: 75
    },
    {
      id: 1003,
      name: "Portable Bluetooth Speaker",
      price: "$59.99",
      originalPrice: "$79.99",
      rating: 4.7,
      reviews: 634,
      category: "Electronics",
      vendor: "TechBrand",
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
      discount: "25% OFF",
      description: "Waterproof speaker with 360-degree sound and 20-hour battery life.",
      stock: 100
    },
    
    // Glow Spa Products
    {
      id: 2001,
      name: "Luxury Skincare Set",
      price: "$149.99",
      originalPrice: "$199.99",
      rating: 4.9,
      reviews: 567,
      category: "Beauty & Wellness",
      vendor: "Glow Spa",
      image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop",
      discount: "25% OFF",
      description: "Complete skincare routine with cleanser, toner, serum, and moisturizer.",
      stock: 30
    },
    {
      id: 2002,
      name: "Aromatherapy Candle Collection",
      price: "$39.99",
      originalPrice: "$49.99",
      rating: 4.5,
      reviews: 423,
      category: "Beauty & Wellness",
      vendor: "Glow Spa",
      image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&h=300&fit=crop",
      discount: "20% OFF",
      description: "Set of 3 premium soy candles with relaxing scents for your home.",
      stock: 60
    },
    {
      id: 2003,
      name: "Professional Hair Care Kit",
      price: "$79.99",
      originalPrice: "$99.99",
      rating: 4.7,
      reviews: 312,
      category: "Beauty & Wellness",
      vendor: "Glow Spa",
      image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300&h=300&fit=crop",
      discount: "20% OFF",
      description: "Premium shampoo, conditioner, and hair mask for all hair types.",
      stock: 45
    },

    // Fine Dining Co Products
    {
      id: 3001,
      name: "Gourmet Gift Basket",
      price: "$89.99",
      originalPrice: "$119.99",
      rating: 4.8,
      reviews: 789,
      category: "Food & Experiences",
      vendor: "Fine Dining Co",
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop",
      discount: "25% OFF",
      description: "Curated selection of premium cheeses, wines, and artisanal snacks.",
      stock: 25
    },
    {
      id: 3002,
      name: "Chef's Choice Meal Kit",
      price: "$69.99",
      originalPrice: "$89.99",
      rating: 4.6,
      reviews: 456,
      category: "Food & Experiences",
      vendor: "Fine Dining Co",
      image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=300&h=300&fit=crop",
      discount: "22% OFF",
      description: "Everything you need to create a restaurant-quality meal at home.",
      stock: 40
    },

    // OrganizePro Products
    {
      id: 4001,
      name: "Premium Storage Solutions Set",
      price: "$119.99",
      originalPrice: "$149.99",
      rating: 4.7,
      reviews: 234,
      category: "Home Services",
      vendor: "OrganizePro",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
      discount: "20% OFF",
      description: "Complete set of storage bins, organizers, and labels for home organization.",
      stock: 35
    },
    {
      id: 4002,
      name: "Closet Organization System",
      price: "$199.99",
      originalPrice: "$249.99",
      rating: 4.8,
      reviews: 178,
      category: "Home Services",
      vendor: "OrganizePro",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
      discount: "20% OFF",
      description: "Modular closet organization system with shelves, drawers, and hanging rods.",
      stock: 20
    },

    // Artisan Crafts Products
    {
      id: 5001,
      name: "Handmade Pottery Vase Set",
      price: "$79.99",
      originalPrice: "$99.99",
      rating: 4.9,
      reviews: 345,
      category: "Local Artisans",
      vendor: "Artisan Crafts",
      image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68581?w=300&h=300&fit=crop",
      discount: "20% OFF",
      description: "Set of 3 unique handcrafted ceramic vases in different sizes.",
      stock: 15
    },
    {
      id: 5002,
      name: "Woven Textile Wall Art",
      price: "$129.99",
      originalPrice: "$159.99",
      rating: 4.7,
      reviews: 267,
      category: "Local Artisans",
      vendor: "Artisan Crafts",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
      discount: "19% OFF",
      description: "Beautiful handwoven textile art piece perfect for home decoration.",
      stock: 10
    },
    {
      id: 5003,
      name: "Leather Crafted Wallet",
      price: "$49.99",
      originalPrice: "$69.99",
      rating: 4.6,
      reviews: 189,
      category: "Local Artisans",
      vendor: "Artisan Crafts",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&h=300&fit=crop",
      discount: "29% OFF",
      description: "Handcrafted genuine leather wallet with multiple card slots and cash pocket.",
      stock: 30
    }
  ]

  // If vendorName is provided, create generic products for that vendor
  if (vendorName) {
    const genericProducts: Product[] = [
      {
        id: Date.now() + 1,
        name: "Premium Product Collection",
        price: "$99.99",
        originalPrice: "$129.99",
        rating: 4.5,
        reviews: 234,
        category: "Electronics",
        vendor: vendorName,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
        discount: "23% OFF",
        description: "High-quality product with excellent features and customer satisfaction.",
        stock: 50
      },
      {
        id: Date.now() + 2,
        name: "Deluxe Service Package",
        price: "$149.99",
        originalPrice: "$199.99",
        rating: 4.7,
        reviews: 156,
        category: "Beauty & Wellness",
        vendor: vendorName,
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop",
        discount: "25% OFF",
        description: "Comprehensive service package designed to meet all your needs.",
        stock: 30
      },
      {
        id: Date.now() + 3,
        name: "Professional Solution Set",
        price: "$79.99",
        originalPrice: "$99.99",
        rating: 4.6,
        reviews: 189,
        category: "Home Services",
        vendor: vendorName,
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
        discount: "20% OFF",
        description: "Professional-grade solution set for home and business use.",
        stock: 40
      },
      {
        id: Date.now() + 4,
        name: "Artisan Crafted Item",
        price: "$59.99",
        originalPrice: "$79.99",
        rating: 4.8,
        reviews: 267,
        category: "Local Artisans",
        vendor: vendorName,
        image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68581?w=300&h=300&fit=crop",
        discount: "25% OFF",
        description: "Beautifully handcrafted item made with attention to detail.",
        stock: 25
      },
      {
        id: Date.now() + 5,
        name: "Gourmet Experience Bundle",
        price: "$119.99",
        originalPrice: "$149.99",
        rating: 4.9,
        reviews: 312,
        category: "Food & Experiences",
        vendor: vendorName,
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop",
        discount: "20% OFF",
        description: "Curated gourmet experience bundle perfect for special occasions.",
        stock: 20
      }
    ]
    genericProducts.forEach(product => {
      saveVendorProduct(product)
    })
  } else {
    // Create products for all dummy vendors
    dummyProducts.forEach(product => {
      saveVendorProduct(product)
    })
  }
}

// Initialize dummy vendor services for a specific vendor
export const initializeDummyVendorServices = (vendorName?: string): void => {
  if (typeof window === "undefined") return
  
  // If vendorName is provided, check if that vendor already has services
  if (vendorName) {
    const existingServices = getVendorServices()
    const vendorServices = existingServices.filter((s) => s.vendor === vendorName)
    if (vendorServices.length > 0) {
      // Vendor already has services, don't overwrite
      return
    }
  } else {
    // Check if any vendor services exist
    const existingServices = getVendorServices()
    if (existingServices.length > 0) {
      // Don't overwrite existing data
      return
    }
  }

  const dummyServices: Service[] = [
    // Glow Spa Services
    {
      id: 6001,
      name: "Full Body Massage Therapy",
      price: "$129.99",
      originalPrice: "$159.99",
      rating: 4.9,
      reviews: 456,
      category: "Beauty & Wellness",
      vendor: "Glow Spa",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&fit=crop",
      discount: "19% OFF",
      description: "Relaxing full body massage to relieve stress and tension. Includes aromatherapy oils.",
      duration: "90 minutes",
      location: "On-site"
    },
    {
      id: 6002,
      name: "Deep Cleansing Facial Treatment",
      price: "$89.99",
      originalPrice: "$120.00",
      rating: 4.7,
      reviews: 567,
      category: "Beauty & Wellness",
      vendor: "Glow Spa",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop",
      discount: "25% OFF",
      description: "Professional facial treatment with extraction, mask, and hydration.",
      duration: "60 minutes",
      location: "On-site"
    },
    {
      id: 6003,
      name: "Manicure & Pedicure Combo",
      price: "$69.99",
      originalPrice: "$89.99",
      rating: 4.6,
      reviews: 423,
      category: "Beauty & Wellness",
      vendor: "Glow Spa",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=300&fit=crop",
      discount: "22% OFF",
      description: "Complete nail care service including shaping, cuticle care, and polish.",
      duration: "75 minutes",
      location: "On-site"
    },

    // Fine Dining Co Services
    {
      id: 7001,
      name: "Private Chef Experience",
      price: "$299.99",
      originalPrice: "$399.99",
      rating: 4.9,
      reviews: 234,
      category: "Food & Experiences",
      vendor: "Fine Dining Co",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop",
      discount: "25% OFF",
      description: "Personal chef comes to your home to prepare a gourmet multi-course meal.",
      duration: "3-4 hours",
      location: "At your location"
    },
    {
      id: 7002,
      name: "Wine Tasting Experience",
      price: "$79.99",
      originalPrice: "$99.99",
      rating: 4.8,
      reviews: 345,
      category: "Food & Experiences",
      vendor: "Fine Dining Co",
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop",
      discount: "20% OFF",
      description: "Guided wine tasting session with expert sommelier and cheese pairing.",
      duration: "2 hours",
      location: "Restaurant"
    },
    {
      id: 7003,
      name: "Cooking Class for Couples",
      price: "$149.99",
      originalPrice: "$199.99",
      rating: 4.7,
      reviews: 267,
      category: "Food & Experiences",
      vendor: "Fine Dining Co",
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop",
      discount: "25% OFF",
      description: "Romantic cooking class where couples learn to prepare a gourmet meal together.",
      duration: "3 hours",
      location: "On-site"
    },

    // OrganizePro Services
    {
      id: 8001,
      name: "Complete Home Organization",
      price: "$399.99",
      originalPrice: "$499.99",
      rating: 4.8,
      reviews: 178,
      category: "Home Services",
      vendor: "OrganizePro",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
      discount: "20% OFF",
      description: "Full home organization service including decluttering, sorting, and storage solutions.",
      duration: "Full day",
      location: "At your location"
    },
    {
      id: 8002,
      name: "Closet Organization Service",
      price: "$199.99",
      originalPrice: "$249.99",
      rating: 4.7,
      reviews: 234,
      category: "Home Services",
      vendor: "OrganizePro",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
      discount: "20% OFF",
      description: "Professional closet organization with custom storage solutions and styling.",
      duration: "4-6 hours",
      location: "At your location"
    },
    {
      id: 8003,
      name: "Kitchen Organization Consultation",
      price: "$149.99",
      originalPrice: "$179.99",
      rating: 4.6,
      reviews: 156,
      category: "Home Services",
      vendor: "OrganizePro",
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop",
      discount: "17% OFF",
      description: "Expert consultation and organization of your kitchen space for maximum efficiency.",
      duration: "3-4 hours",
      location: "At your location"
    },

    // Zen Studio Services
    {
      id: 9001,
      name: "Private Yoga Session",
      price: "$89.99",
      originalPrice: "$119.99",
      rating: 4.9,
      reviews: 312,
      category: "Beauty & Wellness",
      vendor: "Zen Studio",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop",
      discount: "25% OFF",
      description: "One-on-one yoga session tailored to your fitness level and goals.",
      duration: "60 minutes",
      location: "Studio or Home"
    },
    {
      id: 9002,
      name: "Meditation & Mindfulness Workshop",
      price: "$59.99",
      originalPrice: "$79.99",
      rating: 4.7,
      reviews: 189,
      category: "Beauty & Wellness",
      vendor: "Zen Studio",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop",
      discount: "25% OFF",
      description: "Learn meditation techniques and mindfulness practices for stress relief.",
      duration: "90 minutes",
      location: "On-site"
    },
    {
      id: 9003,
      name: "Yoga Retreat Weekend",
      price: "$299.99",
      originalPrice: "$399.99",
      rating: 4.8,
      reviews: 145,
      category: "Beauty & Wellness",
      vendor: "Zen Studio",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop",
      discount: "25% OFF",
      description: "Weekend yoga retreat with multiple classes, meditation, and healthy meals.",
      duration: "2 days",
      location: "Retreat Center"
    },

    // CleanCo Services
    {
      id: 10001,
      name: "Deep Cleaning Service",
      price: "$199.99",
      originalPrice: "$249.99",
      rating: 4.8,
      reviews: 456,
      category: "Home Services",
      vendor: "CleanCo",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop",
      discount: "20% OFF",
      description: "Comprehensive deep cleaning of entire home including all rooms and appliances.",
      duration: "4-6 hours",
      location: "At your location"
    },
    {
      id: 10002,
      name: "Move-In/Move-Out Cleaning",
      price: "$249.99",
      originalPrice: "$299.99",
      rating: 4.7,
      reviews: 234,
      category: "Home Services",
      vendor: "CleanCo",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop",
      discount: "17% OFF",
      description: "Thorough cleaning service for moving in or out of a property.",
      duration: "5-7 hours",
      location: "At your location"
    },
    {
      id: 10003,
      name: "Regular Maintenance Cleaning",
      price: "$129.99",
      originalPrice: "$159.99",
      rating: 4.6,
      reviews: 567,
      category: "Home Services",
      vendor: "CleanCo",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop",
      discount: "19% OFF",
      description: "Weekly or bi-weekly cleaning service to keep your home spotless.",
      duration: "2-3 hours",
      location: "At your location"
    }
  ]

  // If vendorName is provided, create generic services for that vendor
  if (vendorName) {
    const genericServices: Service[] = [
      {
        id: Date.now() + 10,
        name: "Professional Consultation Service",
        price: "$89.99",
        originalPrice: "$119.99",
        rating: 4.6,
        reviews: 178,
        category: "Home Services",
        vendor: vendorName,
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&fit=crop",
        discount: "25% OFF",
        description: "Expert consultation service to help you achieve your goals.",
        duration: "60 minutes",
        location: "At your location"
      },
      {
        id: Date.now() + 11,
        name: "Premium Treatment Package",
        price: "$129.99",
        originalPrice: "$159.99",
        rating: 4.8,
        reviews: 245,
        category: "Beauty & Wellness",
        vendor: vendorName,
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop",
        discount: "19% OFF",
        description: "Comprehensive treatment package for complete relaxation and rejuvenation.",
        duration: "90 minutes",
        location: "On-site"
      },
      {
        id: Date.now() + 12,
        name: "Custom Experience Session",
        price: "$99.99",
        originalPrice: "$129.99",
        rating: 4.7,
        reviews: 156,
        category: "Food & Experiences",
        vendor: vendorName,
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop",
        discount: "23% OFF",
        description: "Personalized experience session tailored to your preferences.",
        duration: "2-3 hours",
        location: "On-site"
      },
      {
        id: Date.now() + 13,
        name: "Complete Service Solution",
        price: "$199.99",
        originalPrice: "$249.99",
        rating: 4.9,
        reviews: 289,
        category: "Home Services",
        vendor: vendorName,
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
        discount: "20% OFF",
        description: "All-inclusive service solution covering all your needs.",
        duration: "Full day",
        location: "At your location"
      },
      {
        id: Date.now() + 14,
        name: "Wellness & Relaxation Session",
        price: "$79.99",
        originalPrice: "$99.99",
        rating: 4.5,
        reviews: 134,
        category: "Beauty & Wellness",
        vendor: vendorName,
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop",
        discount: "20% OFF",
        description: "Relaxing wellness session to help you unwind and recharge.",
        duration: "60 minutes",
        location: "Studio or Home"
      }
    ]
    genericServices.forEach(service => {
      saveVendorService(service)
    })
  } else {
    // Create services for all dummy vendors
    dummyServices.forEach(service => {
      saveVendorService(service)
    })
  }
}

// Initialize dummy orders for a vendor
export const initializeDummyOrders = (vendorId: string, vendorName: string): void => {
  if (typeof window === "undefined") return
  
  const { getOrdersByVendorId, saveOrder } = require("@/lib/vendor-data")
  const existingOrders = getOrdersByVendorId(vendorId)
  if (existingOrders.length > 0) {
    // Vendor already has orders, don't overwrite
    return
  }

  const dummyOrders = [
    {
      id: `order-${Date.now()}-1`,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      customerEmail: "customer1@example.com",
      customerName: "John Doe",
      items: [
        {
          id: 1,
          name: "Premium Wireless Earbuds Pro",
          price: "$129.99",
          quantity: 1,
          type: "product" as const,
          image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop"
        }
      ],
      total: 129.99,
      status: "pending" as const,
      vendorId,
      vendorName,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      orderType: "gift" as const,
      senderAddress: "123 Main St, City, State 12345\nJohn Doe",
      receiverAddress: undefined // Waiting for receiver to fill
    },
    {
      id: `order-${Date.now()}-2`,
      orderNumber: `ORD-${(Date.now() + 1).toString().slice(-6)}`,
      customerEmail: "customer2@example.com",
      customerName: "Jane Smith",
      items: [
        {
          id: 2,
          name: "Full Body Massage Therapy",
          price: "$129.99",
          quantity: 1,
          type: "service" as const,
          image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=300&fit=crop"
        }
      ],
      total: 129.99,
      status: "confirmed" as const,
      vendorId,
      vendorName,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      confirmedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      orderType: "gift" as const,
      senderAddress: "456 Oak Ave, City, State 12345\nJane Smith",
      receiverAddress: "789 Pine Rd, City, State 12345\nSarah Johnson"
    },
    {
      id: `order-${Date.now()}-3`,
      orderNumber: `ORD-${(Date.now() + 2).toString().slice(-6)}`,
      customerEmail: "customer3@example.com",
      customerName: "Bob Johnson",
      items: [
        {
          id: 3,
          name: "Smart Fitness Tracker",
          price: "$89.99",
          quantity: 2,
          type: "product" as const,
          image: "https://images.unsplash.com/photo-1579586337278-3befd40e237a?w=300&h=300&fit=crop"
        }
      ],
      total: 179.98,
      status: "dispatched" as const,
      vendorId,
      vendorName,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      dispatchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      orderType: "self" as const,
      shippingAddress: "789 Pine Rd, City, State 12345\nBob Johnson"
    },
    {
      id: `order-${Date.now()}-4`,
      orderNumber: `ORD-${(Date.now() + 3).toString().slice(-6)}`,
      customerEmail: "customer4@example.com",
      customerName: "Alice Williams",
      items: [
        {
          id: 4,
          name: "Luxury Skincare Set",
          price: "$149.99",
          quantity: 1,
          type: "product" as const,
          image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop"
        },
        {
          id: 5,
          name: "Deep Cleansing Facial Treatment",
          price: "$89.99",
          quantity: 1,
          type: "service" as const,
          image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=300&fit=crop"
        }
      ],
      total: 239.98,
      status: "delivered" as const,
      vendorId,
      vendorName,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      confirmedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      dispatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      orderType: "self" as const,
      shippingAddress: "321 Elm St, City, State 12345\nAlice Williams"
    }
  ]

  dummyOrders.forEach(order => {
    saveOrder(order)
  })
}

// Initialize all dummy vendor data
export const initializeDummyVendorData = (vendorName?: string, vendorId?: string): void => {
  initializeDummyVendorProducts(vendorName)
  initializeDummyVendorServices(vendorName)
  if (vendorId && vendorName) {
    initializeDummyOrders(vendorId, vendorName)
  }
}

