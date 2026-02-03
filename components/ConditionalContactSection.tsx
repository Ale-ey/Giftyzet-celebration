"use client";

import { usePathname } from "next/navigation";
import ContactSection from "@/components/ContactSection";

export default function ConditionalContactSection() {
  const pathname = usePathname() ?? "";
  // Show contact section only on the landing page, not on admin, vendor, or other pages
  const isLandingPage = pathname === "/" || pathname === "";

  if (!isLandingPage) {
    return null;
  }

  return <ContactSection />;
}
