"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ShoppingBag } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Hero Content */}
          <div className="space-y-6 z-10">
            <Badge variant="spicy" className="text-sm">
              <ShoppingBag className="w-3 h-3 mr-1" />
              Street Food Delivered Fresh
            </Badge>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Taste the Streets of <span className="text-primary">India</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md">
              Authentic chaat, spicy snacks, and traditional flavors delivered hot to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="group hover:scale-105 transition-transform">
                Order Now
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="hover:scale-105 transition-transform">
                Explore Menu
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 max-w-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Chaat Varieties</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">15min</p>
                <p className="text-sm text-muted-foreground">Avg Delivery</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">4.8★</p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f"
                alt="Delicious street food spread"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </div>
            
            {/* Floating badges */}
            <Badge variant="popular" className="absolute top-4 right-4 shadow-lg">
              Most Popular
            </Badge>
            <Badge variant="new" className="absolute bottom-4 left-4 shadow-lg">
              Fresh Daily
            </Badge>
          </div>
        </div>
      </div>
    </section>
  )
}