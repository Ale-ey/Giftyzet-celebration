"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  Gift,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Star,
  ShoppingCart,
  Calendar,
  Sparkles,
  Home,
  Cake,
  Shirt,
  Heart,
  SprayCan,
  UtensilsCrossed,
  Key,
  Package,
  Smartphone,
  Palette,
  Flower,
  Shield,
  Lock,
  CreditCard,
  Store,
  CheckCircle2,
  ArrowRight,
  FileText,
  Plug,
  MapPin,
  Clock,
  Search,
} from "lucide-react";
import Image from "next/image";
import { getTopVendorsByRating } from "@/lib/api/vendors";
import AuthModal from "@/components/AuthModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  image_url: string;
  category: string;
  trending_rank?: number;
  reviews_count?: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_hour: number;
  image_url: string;
  location?: string;
  rating?: number;
  reviews_count?: number;
}

interface Vendor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  rating?: number;
  totalProducts?: number;
  product_count?: number;
  category?: string;
}

const categories: Category[] = [
  {
    id: "electronics",
    name: "Electronics",
    icon: "smartphone",
    color: "bg-blue-100",
  },
  { id: "beauty", name: "Beauty", icon: "lipstick", color: "bg-pink-100" },
  { id: "home", name: "Home", icon: "home", color: "bg-orange-100" },
  { id: "food", name: "Food", icon: "cake", color: "bg-amber-100" },
  { id: "fashion", name: "Fashion", icon: "shirt", color: "bg-purple-100" },
  {
    id: "experiences",
    name: "Experiences",
    icon: "heart",
    color: "bg-red-100",
  },
  { id: "cleaning", name: "Cleaning", icon: "spray", color: "bg-green-100" },
  {
    id: "catering",
    name: "Catering",
    icon: "chef-hat",
    color: "bg-emerald-100",
  },
  {
    id: "home-tenders",
    name: "Home Tenders",
    icon: "key",
    color: "bg-gray-100",
  },
  { id: "all-gifts", name: "All Gifts", icon: "gift-box", color: "bg-red-100" },
];

const getCategoryIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    smartphone: Smartphone,
    lipstick: Palette,
    home: Home,
    cake: Cake,
    shirt: Shirt,
    heart: Heart,
    spray: SprayCan,
    "chef-hat": UtensilsCrossed,
    key: Key,
    "gift-box": Package,
  };
  return iconMap[iconName] || Package;
};

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPluginQueryModalOpen, setIsPluginQueryModalOpen] = useState(false);
  const [pluginQuerySubmitting, setPluginQuerySubmitting] = useState(false);
  const [pluginQuerySuccess, setPluginQuerySuccess] = useState(false);
  const [pluginQueryForm, setPluginQueryForm] = useState({
    name: "",
    email: "",
    phone: "",
    query: "",
  });
  const [platformServicePercent, setPlatformServicePercent] = useState<number>(8);
  const [pluginServicePercent, setPluginServicePercent] = useState<number>(0);

  useEffect(() => {
    fetch("/api/settings/checkout")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.tax_percent === "number" && data.tax_percent >= 0) setPlatformServicePercent(data.tax_percent);
        if (typeof data.plugin_tax === "number" && data.plugin_tax >= 0) setPluginServicePercent(data.plugin_tax);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchLandingPageData();
  }, []);

  const fetchLandingPageData = async () => {
    try {
      setLoading(true);
      const [productsRes, servicesRes] = await Promise.all([
        fetch("/api/landing/trending-products"),
        fetch("/api/landing/services?limit=8"),
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setTrendingProducts(productsData.products || []);
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.services || []);
      }

      // Fetch vendors using the existing lib function
      try {
        const vendorsData = await getTopVendorsByRating(4);
        setVendors(vendorsData || []);
      } catch (vendorError) {
        console.error("Error fetching vendors:", vendorError);
        setVendors([]);
      }
    } catch (error) {
      console.error("Error fetching landing page data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Counter animation hook
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !statsAnimated) {
          setStatsAnimated(true);
          animateCounters();
        }
      },
      { threshold: 0.5 },
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [statsAnimated]);

  const animateCounters = () => {
    const counters = [
      {
        id: "rating",
        start: 0,
        end: 4,
        decimals: 0,
        suffix: "/5",
        duration: 2000,
      },
      {
        id: "returns",
        start: 0,
        end: 385,
        decimals: 0,
        suffix: "%",
        duration: 2000,
      },
      {
        id: "gifts",
        start: 0,
        end: 1000000,
        decimals: 0,
        suffix: "+",
        duration: 2500,
      },
      {
        id: "users",
        start: 0,
        end: 50000,
        decimals: 0,
        suffix: "+",
        duration: 2500,
      },
    ];

    counters.forEach((counter) => {
      const element = document.getElementById(counter.id);
      if (!element) return;

      const startTime = Date.now();
      const updateCounter = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / counter.duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(
          counter.start + (counter.end - counter.start) * easeOutQuart,
        );

        if (counter.id === "gifts" && current >= 1000) {
          element.textContent =
            (current / 1000).toFixed(0) + "K" + counter.suffix;
        } else if (counter.id === "users" && current >= 1000) {
          element.textContent =
            (current / 1000).toFixed(0) + "K" + counter.suffix;
        } else {
          element.textContent = current + counter.suffix;
        }

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          // Final value
          if (counter.id === "gifts") {
            element.textContent = "1M" + counter.suffix;
          } else if (counter.id === "users") {
            element.textContent = "50K" + counter.suffix;
          } else {
            element.textContent = counter.end + counter.suffix;
          }
        }
      };

      requestAnimationFrame(updateCounter);
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/marketplace");
    }
  };

  // Map landing page category IDs to database category names
  const categoryMapping: Record<string, string> = {
    electronics: "Electronics",
    beauty: "Beauty & Wellness",
    home: "Home Services",
    food: "Food & Experiences",
    fashion: "Fashion & Apparel",
    experiences: "Food & Experiences",
    cleaning: "Home Services",
    catering: "Food & Experiences",
    "home-tenders": "Home Services",
  };

  const handleCategoryClick = (categoryId: string) => {
    // Forward to marketplace page with category filter
    if (categoryId === "all-gifts") {
      router.push("/marketplace");
    } else {
      // Map the category ID to the actual database category name
      const dbCategory = categoryMapping[categoryId] || categoryId;
      router.push(`/marketplace?category=${encodeURIComponent(dbCategory)}`);
    }
  };

  const scrollCarousel = (
    direction: "left" | "right",
    type: "products" | "services" | "vendors" | "cta",
  ) => {
    const container = document.getElementById(`${type}-carousel`);
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section with Search */}
      <section className="relative bg-gradient-to-b from-purple-700 via-pink-600 to-purple-500 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
              Gift anything to anyone
            </h1>
            <p className="text-lg lg:text-xl text-white/90 mb-8">
              No address needed. Just their phone, email, or @username.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search products, services, or @username for wishlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-white rounded-full px-6 py-4 text-base h-auto"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-lg text-white rounded-full px-8 py-4 h-auto transition-all duration-200 flex items-center gap-2"
              >
                <Search className="h-5 w-5" />
                Search
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:text-white hover:bg-white/10 rounded-full"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                iPhone
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:text-white hover:bg-white/10 rounded-full"
              >
                <Flower className="h-4 w-4 mr-2" />
                Flowers
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:text-white hover:bg-white/10 rounded-full"
              >
                <Cake className="h-4 w-4 mr-2" />
                Cake
              </Button>
            </div>

            {/* Browse Marketplace Button */}
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => router.push("/marketplace")}
                className="bg-primary hover:bg-primary/90 hover:scale-105 hover:shadow-lg text-white rounded-full px-8 py-4 h-auto text-lg transition-all duration-200"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Browse Marketplace
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">
            Shop by Category
          </h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.icon);
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex flex-col items-center gap-2 hover:scale-105 transition-transform"
                >
                  <div
                    className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center`}
                  >
                    <IconComponent className="h-8 w-8 text-gray-700" />
                  </div>
                  <span className="text-xs text-center text-gray-700 font-medium">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Now Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800">Trending Now</h2>
              <TrendingUp className="h-5 w-5 text-pink-500" />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => scrollCarousel("left", "products")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-gray-600" />
              </button>
              <button
                onClick={() => scrollCarousel("right", "products")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-gray-600" />
              </button>
              <Button
                variant="link"
                onClick={() => router.push("/marketplace")}
                className="text-pink-500 hover:text-pink-600"
              >
                View All
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-64 h-80 bg-gray-50 border border-gray-100 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div
              id="products-carousel"
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-custom"
              style={{ scrollbarWidth: "thin" }}
            >
              {trendingProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="flex-shrink-0 w-64 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                          #{index + 1} Trending
                        </span>
                      </div>
                      <div className="w-full h-48 bg-gray-50 relative overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Math.round(Number(product.rating) || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {Number(product.rating ?? 0).toFixed(1)} ({(product.reviews_count ?? 0)} reviews)
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 mb-3">
                        ${product.price?.toFixed(2) || "0.00"}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
                          onClick={() => router.push(`/product/${product.id}`)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Cart
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-primary hover:bg-primary/90 text-white"
                          onClick={() =>
                            router.push(`/product/${product.id}?gift=true`)
                          }
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Gift
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gift a Service Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-purple-800">
                Gift a Service
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => scrollCarousel("left", "services")}
                className="bg-gray-700/80 hover:bg-gray-700 rounded-full p-2 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => scrollCarousel("right", "services")}
                className="bg-gray-700/80 hover:bg-gray-700 rounded-full p-2 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
              <Button
                variant="link"
                onClick={() => router.push("/services")}
                className="text-pink-500 hover:text-pink-600"
              >
                View All
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-80 h-96 bg-gray-50 border border-gray-100 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div
              id="services-carousel"
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-custom"
              style={{ scrollbarWidth: "thin" }}
            >
                {services.length > 0 ? (
                  services.map((service) => (
                    <Card
                      key={service.id}
                      className="flex-shrink-0 w-80 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-lg"
                    >
                      <CardContent className="p-0">
                        {/* Image Section */}
                        <div className="relative">
                          {/* Category Tag */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className="bg-purple-100 text-purple-900 text-xs font-bold px-2 py-1 rounded">
                              {service.category || "Service"}
                            </span>
                          </div>
                          {/* Image */}
                          <div className="w-full h-48 bg-gray-50 relative overflow-hidden rounded-t-lg">
                            {service.image_url ? (
                              <Image
                                src={service.image_url}
                                alt={service.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-4 bg-white rounded-b-lg">
                          {/* Title and Rating */}
                          <div className="mb-2">
                            <h3 className="font-bold text-gray-800 text-base mb-1">
                              {service.name}
                            </h3>
                            <div className="flex items-center gap-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3.5 w-3.5 ${
                                      star <= Math.round(Number(service.rating) || 0)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-gray-200 text-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {Number(service.rating ?? 0).toFixed(1)} ({(service.reviews_count ?? 0)} reviews)
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {service.description}
                          </p>

                          {/* Location */}
                          {service.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                              <MapPin className="h-3 w-3" />
                              <span>{service.location}</span>
                            </div>
                          )}

                          {/* Price and Buttons */}
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-purple-600">
                              ${service.price_per_hour?.toFixed(2) || "0.00"}/hr
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-3 py-2 h-auto"
                                onClick={() =>
                                  router.push(`/service/${service.id}`)
                                }
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Book
                              </Button>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg px-3 py-2 h-auto"
                                onClick={() =>
                                  router.push(`/service/${service.id}?gift=true`)
                                }
                              >
                                <Gift className="h-4 w-4 mr-1" />
                                Gift
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="w-full text-center py-8 text-gray-500">
                    No services available at the moment. Check back soon!
                  </div>
                )}
              </div>
          )}
        </div>
      </section>

      {/* Trusted Vendors Section */}
      <section className="py-12 bg-pink-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Store className="h-6 w-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Trusted Vendors
                </h2>
              </div>
              <p className="text-sm text-gray-600 ml-8">
                Verified merchants ready to fulfill your gifts.
              </p>
            </div>
            <Button
              variant="link"
              onClick={() => router.push("/vendors")}
              className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Vendor Cards Carousel */}
          <div
            id="vendors-carousel"
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-custom"
            style={{ scrollbarWidth: "thin" }}
          >
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-64 h-80 bg-gray-50 border border-gray-100 rounded-lg animate-pulse"
                  />
                ))
              : vendors.slice(0, 4).map((vendor, index) => {
                  const badges = [
                    "Top Seller",
                    "Gift Expert",
                    "Fast Shipping",
                    "Local Business",
                  ];
                  return (
                    <Card
                      key={vendor.id}
                      className="flex-shrink-0 w-64 bg-white hover:shadow-lg transition-shadow border border-gray-200"
                    >
                      <CardContent className="p-6 text-center">
                        {/* Vendor Logo with Verification Badge */}
                        <div className="relative w-20 h-20 mx-auto mb-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                            {vendor.logo_url ? (
                              <Image
                                src={vendor.logo_url}
                                alt={vendor.name}
                                width={80}
                                height={80}
                                className="object-cover"
                              />
                            ) : (
                              <ShoppingBag className="h-10 w-10 text-pink-500" />
                            )}
                          </div>
                          {/* Verification Checkmark */}
                          <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        </div>

                        {/* Vendor Name */}
                        <h3 className="font-bold text-gray-800 mb-1">
                          {vendor.name}
                        </h3>

                        {/* Category */}
                        <p className="text-sm text-gray-500 mb-3">
                          {vendor.category || "General"}
                        </p>

                        {/* Rating and Items */}
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {vendor.rating?.toFixed(1) || "4.5"}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            {vendor.totalProducts || vendor.product_count || 0}{" "}
                            items
                          </span>
                        </div>

                        {/* Yellow Badge */}
                        <div className="mt-4">
                          <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">
                            {badges[index % badges.length]}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>

          {!loading && vendors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No vendors available at the moment. Check back soon!
            </div>
          )}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
        <div className="container mx-auto px-4" ref={statsRef}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div id="rating" className="text-4xl font-bold mb-2">
                0/5
              </div>
              <div className="text-sm opacity-90">Average Rating</div>
            </div>
            <div>
              <div id="returns" className="text-4xl font-bold mb-2">
                0%
              </div>
              <div className="text-sm opacity-90">Happy Returns</div>
            </div>
            <div>
              <div id="gifts" className="text-4xl font-bold mb-2">
                0+
              </div>
              <div className="text-sm opacity-90">Gifts Delivered</div>
            </div>
            <div>
              <div id="users" className="text-4xl font-bold mb-2">
                0+
              </div>
              <div className="text-sm opacity-90">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Stories of <span className="text-pink-500">Joy</span> &{" "}
              <span className="text-purple-500">Connection</span>
            </h2>
            <p className="text-gray-600">
              Real people sharing their experiences with Giftyzet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Chen",
                rating: 5,
                text: "Sending gifts has never been easier! I sent my mom a spa day without even knowing her new address. She was so surprised!",
              },
              {
                name: "Marcus Johnson",
                rating: 5,
                text: "The variety of services is incredible. I gifted my friend a cleaning service for her new apartment. She absolutely loved it!",
              },
              {
                name: "Emily Rodriguez",
                rating: 5,
                text: "I love the wishlist feature! My friends know exactly what I want, and I can share it with just my username. So convenient!",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Verified Customer
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by Leading Brands Section */}
      <section className="py-12 bg-[#FAF7F6]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            {/* Heading */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-10">
              Trusted by leading brands with GiftyZel Checkout
            </h2>

            {/* Brand Logos */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-8">
              {[
                { name: "Samsung", icon: "/collabBrand/samsung.png" },
                { name: "Best Buy", icon: "/collabBrand/best-buy-icon.png" },
                { name: "Nordstrom", icon: "/collabBrand/nordstrom.png" },
                { name: "Sephora", icon: "/collabBrand/sephora.png" },
                { name: "Williams Sonoma", icon: "/collabBrand/ws.png" },
              ].map((brand) => (
                <div
                  key={brand.name}
                  className="flex flex-col items-center gap-3 text-gray-600"
                >
                  <Image
                    src={brand.icon}
                    alt={brand.name}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                  <span className="text-sm md:text-base font-normal text-center">
                    {brand.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Concluding Text */}
            <p className="text-xs md:text-sm text-gray-500 font-normal">
              + 500 more retailers using GiftyZel checkout
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#FAF7F6]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">
              Ready to Create Your Own Success Story?
            </h2>
            
            {/* Cards Container */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sell on GiftyZel Card */}
                <Card className="flex-1 bg-white border-0 shadow-sm">
                  <CardContent className="p-8">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-red-500" />
                    </div>

                    {/* Heading */}
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Sell on GiftyZel
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4">
                      List your products & services on our marketplace. Reach millions of gift-givers.
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                        Platform service: {platformServicePercent}%
                      </span>
                      <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                        No monthly fees
                      </span>
                    </div>

                    {/* Button */}
                    <Button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg px-6 py-3 h-auto"
                    >
                      Apply to Sell
                    </Button>
                  </CardContent>
                </Card>

                {/* Add Gifting to Your Store Card */}
                <Card className="flex-1 bg-white border-0 shadow-sm">
                  <CardContent className="p-8">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <Plug className="h-6 w-6 text-purple-600" />
                    </div>

                    {/* Heading */}
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Add Gifting to Your Store
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4">
                      Install our plugin on your existing website. Let customers gift your products.
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                        Plugin service: {pluginServicePercent}%
                      </span>
                      <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                        10-min setup
                      </span>
                    </div>

                    {/* Button - opens plugin query modal */}
                    <Button
                      onClick={() => setIsPluginQueryModalOpen(true)}
                      className="w-full bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg px-6 py-3 h-auto"
                    >
                      Get the Plugin
                    </Button>
                  </CardContent>
                </Card>
              </div>
          </div>
        </div>
      </section>

      {/* Security & Trust Badges Section */}
      <section className="py-10 bg-gray-50/50 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            {/* Privacy Protected Badge */}
            <div className="flex flex-col items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
              <Image
                src="/privacy.png"
                alt="Privacy Protected"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xs md:text-sm font-medium text-center">Privacy Protected</span>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-12 bg-gray-200 self-stretch" />

            {/* Powered by Stripe */}
            <div className="flex flex-col items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
              <Image
                src="/stripe.png"
                alt="Powered by Stripe"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xs md:text-sm font-medium text-center">Powered by Stripe</span>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-12 bg-gray-200 self-stretch" />

            {/* Secure Payments */}
            <div className="flex flex-col items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
              <Image
                src="/secure-payment.png"
                alt="Secure Payments"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xs md:text-sm font-medium text-center">Secure Payments</span>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-12 bg-gray-200 self-stretch" />

            {/* SSL Encrypted */}
            <div className="flex flex-col items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
              <Image
                src="/ssl-certificate.png"
                alt="SSL Encrypted"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xs md:text-sm font-medium text-center">SSL Encrypted</span>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal - Opens in vendor signup mode */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup-vendor"
      />

      {/* Plugin Query Modal - Add Gifting to Your Store */}
      <Dialog open={isPluginQueryModalOpen} onOpenChange={(open) => {
        setIsPluginQueryModalOpen(open);
        if (!open) {
          setPluginQuerySuccess(false);
          setPluginQueryForm({ name: "", email: "", phone: "", query: "" });
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Get the Plugin
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Add gifting to your store. Tell us a bit about yourself and we&apos;ll get back to you.
            </DialogDescription>
          </DialogHeader>
          {pluginQuerySuccess ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Thanks! We&apos;ll be in touch soon.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setIsPluginQueryModalOpen(false);
                  setPluginQuerySuccess(false);
                  setPluginQueryForm({ name: "", email: "", phone: "", query: "" });
                }}
              >
                Close
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (pluginQuerySubmitting) return;
                setPluginQuerySubmitting(true);
                try {
                  const res = await fetch("/api/plugin-query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(pluginQueryForm),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    alert(data.error || "Failed to submit. Please try again.");
                    setPluginQuerySubmitting(false);
                    return;
                  }
                  setPluginQuerySuccess(true);
                } catch (err) {
                  alert("Something went wrong. Please try again.");
                } finally {
                  setPluginQuerySubmitting(false);
                }
              }}
            >
              <div>
                <label htmlFor="plugin-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  id="plugin-name"
                  type="text"
                  required
                  value={pluginQueryForm.name}
                  onChange={(e) => setPluginQueryForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border-gray-200"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="plugin-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  id="plugin-email"
                  type="email"
                  required
                  value={pluginQueryForm.email}
                  onChange={(e) => setPluginQueryForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border-gray-200"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="plugin-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number
                </label>
                <Input
                  id="plugin-phone"
                  type="tel"
                  value={pluginQueryForm.phone}
                  onChange={(e) => setPluginQueryForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full border-gray-200"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="plugin-query" className="block text-sm font-medium text-gray-700 mb-1">
                  Your query *
                </label>
                <textarea
                  id="plugin-query"
                  required
                  rows={4}
                  value={pluginQueryForm.query}
                  onChange={(e) => setPluginQueryForm((p) => ({ ...p, query: e.target.value }))}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Tell us about your store or what you need..."
                />
              </div>
              <Button
                type="submit"
                disabled={pluginQuerySubmitting}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white"
              >
                {pluginQuerySubmitting ? "Submitting..." : "Submit"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
