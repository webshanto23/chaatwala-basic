"use client"

import data from "../../../sitedata.json"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const galleryImages = data.about.gallery.images


export function GallerySection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {data.about.gallery.heading}
          </h2>
          <p className="text-muted-foreground">
            {data.about.gallery.description}
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