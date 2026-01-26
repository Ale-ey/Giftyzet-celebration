"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  User,
  Settings,
  Users,
  LogOut,
  Heart,
  Gift,
  ShoppingCart,
  Bell,
  Store,
  ShoppingBag,
  Wrench,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthModal from "@/components/AuthModal";
import LogoutConfirmationModal from "@/components/profile/LogoutConfirmationModal";
import {
  getCurrentUserWithProfile,
  signOut as signOutAPI,
} from "@/lib/api/auth";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<"user" | "admin" | "vendor">("user");
  const router = useRouter();

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Load cart count from localStorage
    const updateCartCount = () => {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        const totalItems = cart.reduce(
          (sum: number, item: any) => sum + (item.quantity || 1),
          0,
        );
        setCartCount(totalItems);
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();

    // Listen for storage changes (when cart is updated in other tabs/components)
    window.addEventListener("storage", updateCartCount);

    // Custom event for same-tab updates
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  // Check and listen for auth updates
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const updateAuth = async () => {
      try {
        const userProfile = await getCurrentUserWithProfile();
        if (userProfile) {
          setIsLoggedIn(true);
          setUserEmail(userProfile.email || "");
          setUserRole(
            (userProfile.role as "user" | "admin" | "vendor") || "user",
          );
        } else {
          setIsLoggedIn(false);
          setUserEmail("");
          setUserRole("user");
        }
      } catch (e) {
        setIsLoggedIn(false);
        setUserEmail("");
        setUserRole("user");
      }
    };

    // Initial check
    updateAuth();

    // Listen for auth updates
    const handleAuthUpdate = () => updateAuth();
    window.addEventListener("authUpdated", handleAuthUpdate);

    // Listen to Supabase auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        updateAuth();
      }
    });

    return () => {
      window.removeEventListener("authUpdated", handleAuthUpdate);
      subscription.unsubscribe();
    };
  }, []);

  const [signingOut, setSigningOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { showToast } = useToast();

  const handleSignOutClick = () => {
    setIsLogoutModalOpen(true);
    setIsMenuOpen(false); // Close mobile menu if open
  };

  const handleSignOutConfirm = async () => {
    try {
      setSigningOut(true);
      await signOutAPI();
      setIsLogoutModalOpen(false);
      setIsLoggedIn(false);
      setUserEmail("");
      setUserRole("user");
      setIsMenuOpen(false);
      showToast("Signed out successfully", "success");
      // Small delay to show toast before redirect
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error: any) {
      console.error("Sign out error:", error);
      showToast(
        `Failed to sign out: ${error.message || "Please try again."}`,
        "error",
      );
      setIsLogoutModalOpen(false);
    } finally {
      setSigningOut(false);
    }
  };

  const userName = userEmail.split("@")[0];

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0">
              <Image
                src="/logo.png"
                alt="GiftyZel Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary truncate">
              GiftyZel
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 flex-1 justify-center">
            <Link href="/marketplace">
              <Button
                variant="ghost"
                className="text-gray-900 hover:text-primary hover:bg-primary/10 text-sm xl:text-base transition-colors"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Marketplace
              </Button>
            </Link>
            <Link href="/vendors">
              <Button
                variant="ghost"
                className="text-gray-900 hover:text-primary hover:bg-primary/10 text-sm xl:text-base transition-colors"
              >
                <Store className="h-4 w-4 mr-2" />
                Top Vendors
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="ghost"
                className="text-gray-900 hover:text-primary hover:bg-primary/10 text-sm xl:text-base transition-colors"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Services
              </Button>
            </Link>
            <Link href="/overview">
              <Button
                variant="ghost"
                className="text-gray-900 hover:text-primary hover:bg-primary/10 text-sm xl:text-base transition-colors"
              >
                <Info className="h-4 w-4 mr-2" />
                Overview
              </Button>
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            {/* Cart Icon */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="relative text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>

            {/* Notifications */}
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/notifications")}
                className="relative text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            )}

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white border border-gray-200 shadow-lg text-black"
                >
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer text-black"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/wishlist")}
                    className="cursor-pointer text-black"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Wishlist
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/my-orders")}
                    className="cursor-pointer text-black"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  {userRole === "vendor" && (
                    <DropdownMenuItem
                      onClick={() => router.push("/vendor")}
                      className="cursor-pointer text-black"
                    >
                      <Store className="h-4 w-4 mr-2" />
                      Vendor Dashboard
                    </DropdownMenuItem>
                  )}
                  {userRole === "admin" && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin")}
                      className="cursor-pointer text-black"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleSignOutClick}
                    disabled={signingOut}
                    className="cursor-pointer text-black"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <User className="h-4 w-4" />
              </Button>
            )}

            <Link href="/marketplace">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg text-xs sm:text-sm lg:text-base px-3 lg:px-4 transition-colors">
                <span className="hidden xl:inline">Start Gifting</span>
                <span className="xl:hidden">Gift</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Actions - Icons only */}
          <div className="flex md:hidden items-center space-x-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-900 hover:text-primary hover:bg-primary/10"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/notifications")}
                className="relative p-2 text-gray-900"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-900"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 animate-in fade-in duration-200">
            <nav className="flex flex-col space-y-2">
              <Link href="/marketplace" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="justify-start w-full text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Marketplace
                </Button>
              </Link>
              <Link href="/vendors" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="justify-start w-full text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Store className="h-4 w-4 mr-2" />
                  Top Vendors
                </Button>
              </Link>
              <Link href="/services" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="justify-start w-full text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Services
                </Button>
              </Link>
              <Link href="/overview" onClick={() => setIsMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="justify-start w-full text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Overview
                </Button>
              </Link>

              <div className="pt-2 flex flex-col space-y-2 border-t border-border">
                {isLoggedIn ? (
                  <>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="truncate">{userEmail}</span>
                    </div>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    </Link>
                    <Link href="/wishlist" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Wishlist
                      </Button>
                    </Link>
                    <Link href="/contacts" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        My Contacts
                      </Button>
                    </Link>
                    <Link
                      href="/my-bookings"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        My Bookings
                      </Button>
                    </Link>
                    {userRole === "vendor" && (
                      <Link href="/vendor" onClick={() => setIsMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Store className="h-4 w-4 mr-2" />
                          Vendor Dashboard
                        </Button>
                      </Link>
                    )}
                    {userRole === "admin" && (
                      <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOutClick}
                      disabled={signingOut}
                      className="w-full justify-start text-gray-900 hover:text-primary hover:border-primary transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-gray-900 hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                )}
                <Link href="/marketplace" onClick={() => setIsMenuOpen(false)}>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full transition-colors">
                    <Gift className="h-4 w-4 mr-2" />
                    Start Gifting
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleSignOutConfirm}
        loading={signingOut}
      />
    </header>
  );
}
