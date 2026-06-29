"use client"

import { Button } from "@/components/ui/button"

const galleryImages = [
  { id: 1, src: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f", alt: "Pani Puri" },
  { id: 2, src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", alt: "Burger" },
  { id: 3, src: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092", alt: "Chicken" },
  { id: 4, src: "https://images.unsplash.com/photo-1603133872878-684f208fb84b", alt: "Fried Rice" },
  { id: 5, src: "https://images.unsplash.com/photo-1601050690597-df0568f70950", alt: "Kachori" },
  { id: 6, src: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a", alt: "Chaat" },
]

export function GallerySection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Food Gallery
          </h2>
          <p className="text-muted-foreground">
            A glimpse of our delicious offerings
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((image) => (
            <div 
              key={image.id} 
              className="aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
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