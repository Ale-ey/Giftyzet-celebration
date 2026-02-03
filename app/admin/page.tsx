import type { Metadata } from "next";
import { Suspense } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard - Manage Platform | GiftyZel",
  description: "Manage vendors, products, orders, and platform settings.",
  icons: {
    icon: "/logo.png",
  },
};

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}
