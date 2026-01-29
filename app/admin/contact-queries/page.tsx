import type { Metadata } from "next";
import AdminContactQueriesPage from "@/components/admin/AdminContactQueriesPage";

export const metadata: Metadata = {
  title: "Contact Queries | Admin",
  description: "View contact form submissions.",
};

export default function AdminContactQueriesRoute() {
  return <AdminContactQueriesPage />;
}
