"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Store,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp, signIn } from "@/lib/api/auth";
import { createVendor, createStore } from "@/lib/api/vendors";
import { getCurrentUser } from "@/lib/api/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

type AuthMode = "signin" | "signup" | "signup-vendor";

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "signin",
}: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signin") {
        // Sign in
        const { user } = await signIn({ email, password });

        if (user) {
          // Dispatch event to update header
          window.dispatchEvent(new Event("authUpdated"));
          onClose();
          resetForm();

          // Check user role and redirect accordingly
          const { getCurrentUserWithProfile } = await import("@/lib/api/auth");
          try {
            const userProfile = await getCurrentUserWithProfile();
            if (userProfile?.role === "admin") {
              // Redirect admin to admin dashboard
              router.push("/admin");
            } else if (userProfile?.role === "vendor") {
              // Check store status for vendors
              const { getVendorByUserId, getStoreByVendorId } =
                await import("@/lib/api/vendors");
              const vendor = await getVendorByUserId(user.id);
              if (vendor) {
                const store = await getStoreByVendorId(vendor.id);
                if (
                  !store ||
                  store.status === "pending" ||
                  store.status === "rejected"
                ) {
                  router.push("/vendor/register-store");
                } else {
                  router.push("/vendor");
                }
              } else {
                router.push("/vendor/register-store");
              }
            } else {
              router.push("/marketplace");
            }
          } catch {
            router.push("/marketplace");
          }
        }
      } else if (mode === "signup") {
        // User sign up
        const { user, needsEmailConfirmation } = await signUp({
          email,
          password,
          name,
          role: "user",
        });

        if (user) {
          if (needsEmailConfirmation) {
            // Show email confirmation message
            setEmailSent(true);
            setSignupEmail(email);
            resetForm();
          } else {
            window.dispatchEvent(new Event("authUpdated"));
            onClose();
            resetForm();
            router.push("/profile");
          }
        }
      } else if (mode === "signup-vendor") {
        // Vendor sign up
        if (!vendorName.trim()) {
          setError("Business/Vendor name is required");
          setLoading(false);
          return;
        }

        // Create user account
        const { user, needsEmailConfirmation } = await signUp({
          email,
          password,
          name,
          role: "vendor",
          vendor_name: vendorName,
        });

        if (!user) {
          throw new Error("Failed to create user account");
        }

        if (needsEmailConfirmation) {
          // Show email confirmation message
          // Vendor profile will be created after email confirmation via trigger
          setEmailSent(true);
          setSignupEmail(email);
          resetForm();
        } else {
          // Email confirmation disabled - create vendor immediately
          try {
            // Create vendor profile
            const vendor = await createVendor(user.id, {
              vendor_name: vendorName,
              email: email,
              business_name: vendorName,
            });

            // Create store with pending status
            await createStore(vendor.id, {
              name: vendorName,
              description: `Store for ${vendorName}`,
            });

            window.dispatchEvent(new Event("authUpdated"));
            onClose();
            resetForm();
            // Redirect to store registration page
            router.push("/vendor/register-store");
          } catch (vendorError: any) {
            // If vendor creation fails, still show email confirmation
            // Vendor can be created after email confirmation
            console.warn(
              "Vendor creation failed, will be created after email confirmation:",
              vendorError,
            );
            setEmailSent(true);
            setSignupEmail(email);
            resetForm();
          }
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const is429 = err?.status === 429 || String(err?.message || "").toLowerCase().includes("429") || String(err?.message || "").toLowerCase().includes("rate limit");
      setError(
        is429
          ? "Too many signup attempts. Please wait a few minutes and try again, or try from a different network."
          : err?.message || "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setVendorName("");
    setError(null);
    setShowPassword(false);
  };

  const handleCloseEmailSent = () => {
    setEmailSent(false);
    setSignupEmail("");
    onClose();
  };

  const switchToSignIn = () => {
    setMode("signin");
    resetForm();
  };

  const switchToSignUp = () => {
    setMode("signup");
    resetForm();
  };

  const switchToVendorSignUp = () => {
    setMode("signup-vendor");
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {mode === "signin" && "Sign In"}
            {mode === "signup" && "Sign Up"}
            {mode === "signup-vendor" && "Sign Up as Vendor"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signin" && "Welcome back! Sign in to your account."}
            {mode === "signup" && "Create a new account to start gifting."}
            {mode === "signup-vendor" &&
              "Join as a vendor to sell your products and services."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {(mode === "signup" || mode === "signup-vendor") && (
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-semibold text-gray-900"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required={mode === "signup" || mode === "signup-vendor"}
                />
              </div>
            </div>
          )}

          {mode === "signup-vendor" && (
            <div className="space-y-2">
              <label
                htmlFor="vendorName"
                className="text-sm font-semibold text-gray-900"
              >
                Business/Vendor Name
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="vendorName"
                  type="text"
                  placeholder="Enter your business name"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-gray-900"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-gray-900"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {mode === "signin" && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            variant="outline"
            className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : mode === "signin"
                ? "Sign In"
                : "Sign Up"}
          </Button>
        </form>

        {/* Email Confirmation Message */}
        {emailSent && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900 mb-1">
                  Check your email
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  We've sent a confirmation email to{" "}
                  <strong>{signupEmail}</strong>. Please check your inbox and
                  click the confirmation link to activate your account.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseEmailSent}
                  className="w-full border-green-300 text-green-700 hover:bg-green-100"
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mode Switcher */}
        {!emailSent && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {mode === "signin" ? (
              <div className="space-y-3">
                <p className="text-sm text-center text-gray-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={switchToSignUp}
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    Sign Up
                  </button>
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-500 uppercase">or</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                  onClick={switchToVendorSignUp}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Sign Up as Vendor
                </Button>
              </div>
            ) : mode === "signup" ? (
              <div className="space-y-3">
                <p className="text-sm text-center text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchToSignIn}
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    Sign In
                  </button>
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-500 uppercase">or</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium"
                  onClick={switchToVendorSignUp}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Sign Up as Vendor
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-center text-gray-600">
                  Want to sign up as a regular user?{" "}
                  <button
                    type="button"
                    onClick={switchToSignUp}
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    Sign Up
                  </button>
                </p>
                <p className="text-sm text-center text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchToSignIn}
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
