"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Gift, Heart, Sparkles, Users, Play } from "lucide-react"

export default function HeroSection() {
  const [recipientInfo, setRecipientInfo] = useState("")
  const router = useRouter()
  
  // Hardcoded user state - change to false to show logged out behavior
  const isLoggedIn = true

  const handleStartGifting = () => {
    if (!isLoggedIn) {
      router.push("/auth")
    } else {
      router.push("/send-gift")
    }
  }

  const handleQuickGift = () => {
    if (!isLoggedIn) {
      router.push("/auth")
    } else {
      // In a real app, you'd pass this via query params or state management
      router.push(`/send-gift?recipient=${encodeURIComponent(recipientInfo)}`)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 py-20 lg:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 animate-bounce">
          <Gift className="h-16 w-16 text-yellow-300" />
        </div>
        <div className="absolute top-20 right-20 animate-bounce delay-200">
          <Heart className="h-12 w-12 text-pink-300" />
        </div>
        <div className="absolute bottom-20 left-20 animate-bounce delay-300">
          <Sparkles className="h-14 w-14 text-yellow-200" />
        </div>
        <div className="absolute bottom-10 right-10 animate-bounce delay-500">
          <Users className="h-18 w-18 text-purple-300" />
        </div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 animate-in fade-in duration-1000">
            Send <span className="relative inline-block">
              Perfect Gifts
              <div className="absolute -bottom-2 left-0 right-0 h-2 bg-yellow-300/30 rounded-full" />
            </span>
            <br />
            Without Knowing Their Address
          </h1>
          
          <p className="text-xl lg:text-2xl text-white/90 mb-8 animate-in fade-in duration-1000 delay-200">
            Gift anything to anyone using just their phone number, email, or social media.
            <br />
            <span className="text-yellow-200 font-semibold">No addresses. No awkward gift cards. Just pure joy.</span>
          </p>

          {/* Quick Gift Form */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8 mb-8 animate-in fade-in duration-1000 delay-300 border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Send Your First Gift in 60 Seconds
            </h3>
            <div className="flex flex-col lg:flex-row gap-4 max-w-2xl mx-auto">
              <Input
                placeholder="Enter phone, email, or @username"
                value={recipientInfo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipientInfo(e.target.value)}
                className="flex-1 bg-white/90 border-white/50 text-foreground placeholder:text-muted-foreground focus:bg-white focus:border-white rounded-xl"
              />
              <Button 
                size="lg" 
                onClick={handleQuickGift}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Gift className="h-5 w-5 mr-2" />
                Start Gifting
              </Button>
            </div>
            <p className="text-white/70 text-sm mt-3">
              Try: +1234567890, friend@email.com, or @username
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-in fade-in duration-1000 delay-400">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white">1M+</div>
              <div className="text-white/80">Gifts Delivered</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-white/80">Happy Gifters</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-white/80">Privacy Protected</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 animate-in fade-in duration-1000 delay-500">
            <Button 
              size="lg" 
              onClick={handleStartGifting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Gift className="h-5 w-5 mr-2" />
              Send a Gift Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-3 bg-transparent"
            >
              <Play className="h-5 w-5 mr-2" />
              Watch How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
