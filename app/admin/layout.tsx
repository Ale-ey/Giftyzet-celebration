"use client"

import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Store, Percent, Wallet, Plug, MessageSquare } from "lucide-react"

type TabId =
  | "stores"
  | "commission"
  | "payouts"
  | "pluginOrders"
  | "pluginIntegrations"
  | "queries"
  | "pluginQueries"

const navItems: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "stores", label: "Stores", icon: <Store className="h-4 w-4" /> },
  { id: "commission", label: "Tax & Plugin", icon: <Percent className="h-4 w-4" /> },
  { id: "payouts", label: "Payouts", icon: <Wallet className="h-4 w-4" /> },
  { id: "pluginOrders", label: "Plugin Orders", icon: <Plug className="h-4 w-4" /> },
  { id: "pluginIntegrations", label: "Plugin API Keys", icon: <Plug className="h-4 w-4" /> },
  { id: "queries", label: "Contact Queries", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "pluginQueries", label: "Plugin Queries", icon: <Plug className="h-4 w-4" /> },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const currentTab: TabId =
    pathname?.startsWith("/admin/contact-queries")
      ? "queries"
      : pathname?.startsWith("/admin/plugin-queries")
      ? "pluginQueries"
      : "stores"

  const handleNavClick = (id: TabId) => {
    // For sections that live on the main /admin dashboard, use a tab query param.
    if (id === "stores" || id === "commission" || id === "payouts" || id === "pluginOrders" || id === "pluginIntegrations") {
      const params = new URLSearchParams()
      params.set("tab", id)
      router.push(`/admin?${params.toString()}`)
      return
    }

    // Dedicated routes for these sections
    if (id === "queries") {
      router.push("/admin/contact-queries")
      return
    }
    if (id === "pluginQueries") {
      router.push("/admin/plugin-queries")
      return
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      <aside className="w-64 border-r border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              GZ
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">GiftyZel Admin</div>
              <div className="text-xs text-gray-500">Platform control center</div>
            </div>
          </div>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = currentTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
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
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  )
}

