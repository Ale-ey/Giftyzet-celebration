"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, Store, Package, Wallet, ClipboardList } from "lucide-react"

type VendorTabId = "dashboard" | "store" | "products" | "orders" | "payouts"

const navItems: { id: VendorTabId; label: string; icon: ReactNode; href: string }[] = [
  { id: "dashboard", label: "Overview", icon: <Home className="h-4 w-4" />, href: "/vendor" },
  { id: "store", label: "Store setup", icon: <Store className="h-4 w-4" />, href: "/vendor/store" },
  { id: "products", label: "Products", icon: <Package className="h-4 w-4" />, href: "/vendor/products" },
  { id: "orders", label: "Orders", icon: <ClipboardList className="h-4 w-4" />, href: "/vendor/orders" },
  { id: "payouts", label: "Payouts", icon: <Wallet className="h-4 w-4" />, href: "/vendor/payouts" },
]

export default function VendorLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const currentId: VendorTabId =
    pathname?.startsWith("/vendor/store")
      ? "store"
      : pathname?.startsWith("/vendor/products")
      ? "products"
      : pathname?.startsWith("/vendor/orders")
      ? "orders"
      : pathname?.startsWith("/vendor/payouts")
      ? "payouts"
      : "dashboard"

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 border-r border-gray-200 bg-white/90 backdrop-blur-sm overflow-y-auto">
        <div className="px-5 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              V
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Vendor panel</div>
              <div className="text-xs text-gray-500">Manage your store</div>
            </div>
          </div>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = currentId === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${
                    active
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                <span
                  className={`flex items-center justify-center rounded-md ${
                    active ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  )
}

