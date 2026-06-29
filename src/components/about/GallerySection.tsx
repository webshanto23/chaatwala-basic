"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

const galleryImages = [
  { id: 1, src: "https://images.unsplash.com/photo-1523580494863-6f3031224c94", alt: "Pani Puri" },
  { id: 2, src: "https://images.unsplash.com/photo-1531058020387-3be344556be6", alt: "Burger" },
  { id: 3, src: "https://images.unsplash.com/photo-1492724441997-5dc865305da7", alt: "Chicken" },
  { id: 4, src: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f", alt: "Fried Rice" },
  { id: 5, src: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678", alt: "Kachori" },
  { id: 6, src: "https://images.unsplash.com/photo-1531058020387-3be344556be6", alt: "Chaat" },
]


export function GallerySection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Our Achievements so Far
          </h2>
          <p className="text-muted-foreground">
            A glimpse of our journey and the milestones we have reached. From humble beginnings to becoming a beloved name in the community, our gallery showcases the moments that define us.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((image) => (
            <div 
              key={image.id} 
              className="aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 relative"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover hover:scale-110 transition-transform duration-500"
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            View More
          </Button>
        </div>
      </div>
    </section>
  )
}