"use client"

import { Card, CardContent } from "@/components/ui/card"
import { features } from "@/lib/constants"

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            Why <span className="text-primary">GiftyZel</span> Changes Everything
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We've reimagined gifting from the ground up. No more guessing addresses, 
            no more impersonal gift cards, no more complicated processes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card 
                key={feature.title} 
                className="group hover:shadow-xl border-2 border-gray-100 hover:border-primary/20 transition-all duration-300 hover:-translate-y-2 bg-white"
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-start">
                    <div className={`p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 mb-4 group-hover:scale-110`}>
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-base">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Process Flow */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How It Works in <span className="text-primary">3 Simple Steps</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:scale-110 transition-transform duration-300"
                style={{ background: 'var(--gradient-celebration)' }}
              >
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Choose Recipient</h4>
              <p className="text-gray-600">
                Enter their phone, email, or social handle. That's all we need.
              </p>
            </div>
            
            <div className="text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:scale-110 transition-transform duration-300"
                style={{ background: 'var(--gradient-gift)' }}
              >
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Pick Perfect Gift</h4>
              <p className="text-gray-600">
                Browse products, services, or their wishlist for the perfect choice.
              </p>
            </div>
            
            <div className="text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:scale-110 transition-transform duration-300"
                style={{ background: 'var(--gradient-hero)' }}
              >
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Send & Celebrate</h4>
              <p className="text-gray-600">
                They get notified, provide delivery details, and enjoy your thoughtful gift.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
