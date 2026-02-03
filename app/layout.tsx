import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ConditionalContactSection from "@/components/ConditionalContactSection";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GiftyZel - Send Perfect Gifts Without Knowing Addresses",
    template: "%s | GiftyZel",
  },
  description:
    "Send thoughtful gifts to anyone using just their phone number, email, or social media. Privacy-first gifting platform.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://giftyzel.com",
  ),
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/logo.png", sizes: "180x180", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ToastProvider>
          <Header />
          {children}
          <ConditionalContactSection />
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
