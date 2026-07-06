"use client"

import data from "../../../sitedata.json"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const galleryImages = data.about.gallery.images


export function GallerySection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-secondary/5 via-background to-primary/10">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-border/70 bg-white/95 p-8 shadow-xl shadow-secondary/10">
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
              className="aspect-square rounded-[1.75rem] overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="rounded-full border-border/70 text-foreground hover:bg-primary/10 hover:text-primary">
            View More
          </Button>
        </div>
      </div>
    </section>
  )
}