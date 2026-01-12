"use client"

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api/auth";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Marketing Manager",
    content: "I sent my sister a spa day for her birthday without knowing her address. She was so surprised and grateful! GiftyZel made it feel magical.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Marcus Johnson", 
    role: "Software Engineer",
    content: "Group gifting for my mom's 60th was seamless. 12 family members contributed to get her dream vacation. The wishlist feature is genius!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Emily Rodriguez",
    role: "Teacher",
    content: "As a small business owner, joining GiftyZel's marketplace was the best decision. My handmade jewelry now reaches gift-givers nationwide!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "David Kim",
    role: "Father of 3",
    content: "My kids' Christmas lists are all on GiftyZel now. Grandparents and aunts can see exactly what they want and contribute together. No more duplicate toys!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Lisa Thompson",
    role: "Event Planner",
    content: "I use GiftyZel for all my clients' registries. The hybrid system works perfectly for everything from baby showers to corporate events.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face"
  },
  {
    name: "Alex Wright",
    role: "College Student",
    content: "Receiving gifts through GiftyZel feels like Christmas morning every time. I love that my privacy is protected while still getting thoughtful gifts.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face"
  }
];

export const TestimonialsSection = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleStartGifting = () => {
    if (user) {
      router.push('/marketplace');
    } else {
      router.push('/auth/login');
    }
  };

  const handleCreateWishlist = () => {
    if (user) {
      router.push('/wishlist');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Stories of <span className="bg-gradient-celebration bg-clip-text text-transparent">Joy</span> & <span className="bg-gradient-celebration bg-clip-text text-transparent">Connection</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real people sharing how GiftyZel transformed their gifting experience and brought more joy to their relationships.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="bg-gradient-celebration rounded-2xl p-8 mb-16 text-center text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold">4.9/5</div>
              <div className="text-white/90 text-sm">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold">98%</div>
              <div className="text-white/90 text-sm">Happy Recipients</div>
            </div>
            <div>
              <div className="text-3xl font-bold">1M+</div>
              <div className="text-white/90 text-sm">Gifts Delivered</div>
            </div>
            <div>
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-white/90 text-sm">Active Users</div>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name}
              className="group hover:shadow-celebration transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Quote className="h-8 w-8 text-primary/20 mr-2" />
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-yellow-500" />
                    ))}
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center space-x-3">
                  <img 
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold group-hover:text-primary transition-colors">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-semibold mb-4">
            Ready to Create Your Own Success Story?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of happy gifters and recipients who've discovered the joy of thoughtful, effortless giving.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-gradient-celebration hover:opacity-90 text-white px-8 py-3 rounded-lg font-semibold shadow-celebration transition-all duration-300 hover:-translate-y-1"
              onClick={handleStartGifting}
            >
              Start Gifting Today
            </Button>
            <Button 
              variant="outline"
              className="border border-primary text-primary hover:bg-primary/10 px-8 py-3 rounded-lg font-semibold transition-all duration-300"
              onClick={handleCreateWishlist}
            >
              Create Your Wishlist
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};