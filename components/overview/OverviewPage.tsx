"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Store, PlayCircle, PauseCircle } from "lucide-react";

export default function OverviewPage() {
  const [isGiftingVideoPlaying, setIsGiftingVideoPlaying] = useState(false);
  const [isVendorVideoPlaying, setIsVendorVideoPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How to Use GiftyZel
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn how to send meaningful gifts and grow your business with our
            platform
          </p>
        </div>

        {/* Video Sections */}
        <div className="space-y-12 max-w-5xl mx-auto">
          {/* Section 1: How to Send Gifts */}
          <Card className="overflow-hidden shadow-sm border hover:shadow-md transition-shadow bg-white">
            <CardHeader className="bg-primary/5 border-b border-gray-100">
              <CardTitle className="flex items-center gap-3 text-2xl text-gray-900">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                How to Send Gifts on GiftyZel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Video Player */}
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    poster="/placeholder-gift-tutorial.jpg"
                    onPlay={() => setIsGiftingVideoPlaying(true)}
                    onPause={() => setIsGiftingVideoPlaying(false)}
                    onEnded={() => setIsGiftingVideoPlaying(false)}
                  >
                    <source
                      src="/videos/how-to-send-gifts.mp4"
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>

                  {/* Play/Pause Overlay */}
                  {!isGiftingVideoPlaying && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors cursor-pointer"
                      onClick={(e) => {
                        const video = e.currentTarget
                          .previousElementSibling as HTMLVideoElement;
                        if (video) {
                          video.play();
                        }
                      }}
                    >
                      <PlayCircle className="h-20 w-20 text-white opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Step 1: Browse
                    </h3>
                    <p className="text-sm text-gray-600">
                      Explore our marketplace to find the perfect gift from
                      thousands of products and services.
                    </p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Step 2: Add to Cart
                    </h3>
                    <p className="text-sm text-gray-600">
                      Select your items and add them to your cart with just one
                      click.
                    </p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Step 3: Checkout
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enter recipient details and choose your delivery
                      preferences.
                    </p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Step 4: Send
                    </h3>
                    <p className="text-sm text-gray-600">
                      Complete the payment and share the link with the receiver.
                      The receiver will fill in their address and receive the
                      gift.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: How to Register as Vendor */}
          <Card className="overflow-hidden shadow-sm border hover:shadow-md transition-shadow bg-white">
            <CardHeader className="bg-primary/5 border-b border-gray-100">
              <CardTitle className="flex items-center gap-3 text-2xl text-gray-900">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                How to Register and Use as a Vendor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Video Player */}
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    poster="/placeholder-vendor-tutorial.jpg"
                    onPlay={() => setIsVendorVideoPlaying(true)}
                    onPause={() => setIsVendorVideoPlaying(false)}
                    onEnded={() => setIsVendorVideoPlaying(false)}
                  >
                    <source
                      src="/videos/how-to-register-as-vendor.mp4"
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>

                  {/* Play/Pause Overlay */}
                  {!isVendorVideoPlaying && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors cursor-pointer"
                      onClick={(e) => {
                        const video = e.currentTarget
                          .previousElementSibling as HTMLVideoElement;
                        if (video) {
                          video.play();
                        }
                      }}
                    >
                      <PlayCircle className="h-20 w-20 text-white opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Step 1: Sign Up
                    </h3>
                    <p className="text-sm text-gray-600">
                      Click "Register as Vendor" and create your business
                      account with your details.
                    </p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Step 2: Set Up Store
                    </h3>
                    <p className="text-sm text-gray-600">
                      Complete your store profile with business information and
                      branding.
                    </p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Step 3: Add Products
                    </h3>
                    <p className="text-sm text-gray-600">
                      Upload your products or services with images,
                      descriptions, and pricing.
                    </p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Step 4: Start Selling
                    </h3>
                    <p className="text-sm text-gray-600">
                      Once approved, your products will be visible to customers
                      and you can start receiving orders.
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    📋 What You Need:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Valid business name and registration details</li>
                    <li>• Contact information (email and phone number)</li>
                    <li>• Product/service images and descriptions</li>
                    <li>
                      • Payment and banking information for receiving payments
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-6">
              Join thousands of happy customers and successful vendors on
              GiftyZel
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/marketplace"
                className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-semibold transition-colors"
              >
                <Gift className="h-5 w-5 mr-2" />
                Start Gifting
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-8 py-3 rounded-full font-semibold transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // Scroll to landing page and trigger vendor modal
                  window.location.href = "/#vendor-signup";
                }}
              >
                <Store className="h-5 w-5 mr-2" />
                Become a Vendor
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
