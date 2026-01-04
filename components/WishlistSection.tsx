"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Gift, Star, Plus } from "lucide-react"
import { wishlistTypes } from "@/lib/constants"

const sampleWishlistItems = [
  {
    name: "MacBook Pro 14-inch",
    price: "$1,999",
    priority: "Essential",
    status: "50% funded",
    contributors: 8
  },
  {
    name: "Coffee Subscription",
    price: "$89",
    priority: "Nice-to-have", 
    status: "Fully funded",
    contributors: 3
  },
  {
    name: "Yoga Classes (10 pack)",
    price: "$120",
    priority: "Optional",
    status: "25% funded",
    contributors: 2
  }
]

export default function WishlistSection() {
  const router = useRouter()
  
  // Hardcoded user state - change to false to show logged out behavior
  const isLoggedIn = true

  const handleCreateWishlist = () => {
    if (isLoggedIn) {
      router.push('/wishlist')
    } else {
      router.push('/auth?mode=signup')
    }
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            Smart <span className="text-primary">Wishlist & Registry</span> System
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The first hybrid wishlist that adapts from everyday wants to life events. 
            Create lists, enable group gifting, and never receive duplicate gifts again.
          </p>
        </div>

        {/* Wishlist Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {wishlistTypes.map((list, index) => {
            const Icon = list.icon
            return (
              <Card 
                key={list.type}
                className="group hover:shadow-xl border-2 border-gray-100 hover:border-primary/20 transition-all duration-300 hover:-translate-y-2 bg-white"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${list.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${list.color}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {list.progress}% Complete
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors text-gray-900">
                    {list.type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{list.items} items</span>
                      <span className="font-semibold text-gray-900">{list.totalValue}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${list.progress}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        {list.contributors} contributors
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">
                        View List
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-gray-900">
              Everything You Need in One Smart List
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Priority System</h4>
                  <p className="text-gray-600 text-sm">
                    Tag items as Essential, Nice-to-have, or Optional to guide gifters.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center mt-1">
                  <Users className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Group Contributions</h4>
                  <p className="text-gray-600 text-sm">
                    Friends and family can pool money for bigger, better gifts.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mt-1">
                  <Gift className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Registry Lock</h4>
                  <p className="text-gray-600 text-sm">
                    Automatically prevents duplicate gifts and updates in real-time.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              onClick={handleCreateWishlist}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your Wishlist
            </Button>
          </div>

          {/* Sample Wishlist */}
          <Card className="shadow-lg border-2 border-gray-100 bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900">Sarah's Birthday Wishlist</CardTitle>
                <Badge className="bg-primary text-primary-foreground">
                  Public
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Birthday: December 15th • 8 contributors
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleWishlistItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            item.priority === 'Essential' ? 'border-primary text-primary' :
                            item.priority === 'Nice-to-have' ? 'border-secondary text-secondary' :
                            'border-gray-400 text-gray-600'
                          }`}
                        >
                          {item.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span className="font-semibold text-gray-900">{item.price}</span>
                        <span>{item.status}</span>
                        <span>{item.contributors} contributors</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Gift className="h-3 w-3 mr-1" />
                      Gift
                    </Button>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-gray-300 text-gray-900 hover:bg-gray-50"
                  onClick={handleCreateWishlist}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item to List
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
