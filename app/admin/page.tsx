import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard - Manage Platform | GiftyZel",
  description: "Manage vendors, products, orders, and platform settings.",
  icons: {
    icon: "/logo.png",
  },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
