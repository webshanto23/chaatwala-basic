import { AboutHeader } from "@/components/about/about-header"
import { ContactSection } from "@/components/about/contact-us"
import { FaqSection } from "@/components/about/faq-section"
import { HistorySection } from "@/components/about/history"
import MapSection from "@/components/about/map-section"
import { OwnersTakeSection } from "@/components/about/owners-take"
import { VisionSection } from "@/components/about/vision"
import { MetricsStrip } from "@/components/home/MetricsStrip"
import { WhyChaatwala } from "@/components/home/WhyChaatwala"
import dynamic from "next/dynamic"

const GallerySection = dynamic(() => import("@/components/about/GallerySection").then(m => m.GallerySection), {
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-[1.75rem] bg-muted animate-pulse" />
      ))}
    </div>
  ),
})

export default function AboutPage() {
  return (
    <main className="px-4 md:px-6 lg:px-8 py-10 md:py-16 space-y-16 mx-auto max-w-7xl">
      <section className="text-center space-y-3">
        <AboutHeader />
      </section>
      <section>
        <WhyChaatwala />
        <GallerySection />
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HistorySection />
        <VisionSection />
        <OwnersTakeSection />
      </section>

      <section>
        <FaqSection />
      </section>
      <section>
        <MetricsStrip />
      </section>
      <section>
        <MapSection />
      </section>

      <section>
        <ContactSection />
      </section>
    </main>
  )
}
