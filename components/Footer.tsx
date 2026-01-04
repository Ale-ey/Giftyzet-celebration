"use client"

import { Gift, Heart, Mail, Phone, MapPin, Twitter, Instagram, Facebook } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Gift className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full" />
              </div>
              <h3 className="text-2xl font-bold text-primary">
                GiftyZel
              </h3>
            </div>
            <p className="text-gray-600 max-w-md">
              Making thoughtful giving effortless, secure, and joyful. Send perfect gifts using just a phone number, email, or social handle.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/giftyzel" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/giftyzel" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://facebook.com/giftyzel" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Email</div>
                  <a href="mailto:hello@giftyzel.com" className="text-sm text-gray-600 hover:text-primary transition-colors">
                    hello@giftyzel.com
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Phone</div>
                  <a href="tel:18004438995" className="text-sm text-gray-600 hover:text-primary transition-colors">
                    1-800-GIFTYZEL
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Location</div>
                  <div className="text-sm text-gray-600">Houston, TX</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-gray-600 hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm mb-4 md:mb-0">
              © 2025 GiftyZel. All rights reserved. Made with <Heart className="h-4 w-4 inline text-primary" /> for gift-givers everywhere.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
