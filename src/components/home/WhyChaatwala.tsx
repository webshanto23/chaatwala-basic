"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Leaf, Flame, Clock, Shield } from "lucide-react"

const features = [
  {
    icon: Leaf,
    title: "Fresh Ingredients",
    description: "Locally sourced, seasonal produce",
    color: "text-primary"
  },
  {
    icon: Flame,
    title: "Authentic Taste",
    description: "Traditional recipes from the streets",
    color: "text-secondary"
  },
  {
    icon: Clock,
    title: "Fast Delivery",
    description: "30 min or less guaranteed",
    color: "text-accent"
  },
  {
    icon: Shield,
    title: "Hygienic Prep",
    description: "Contactless, safe packaging",
    color: "text-primary"
  }
]

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function WhyChaatwala() {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm font-medium">
            Why Choose Us
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Chaatwala?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We bring you the authentic flavors of Indian street food with uncompromising quality
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className="text-center p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 bg-card border-border"
            >
              <CardContent className="space-y-4 pt-4">
                <div className={cn("w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center", feature.color)}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}