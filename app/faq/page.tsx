import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about GiftyZel.",
};

export default function FAQPage() {
  return (
    <main className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>
        <p className="text-gray-600 mb-8">
          Have more questions?{" "}
          <a href="mailto:hello@giftyzel.com" className="text-primary hover:underline">
            Contact us at hello@giftyzel.com
          </a>
        </p>
        <div className="space-y-6 text-gray-600">
          <p>FAQ content can be added here. For now, reach out via email for any questions.</p>
        </div>
        <div className="mt-12">
          <Link href="/" className="text-primary hover:underline font-medium">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
