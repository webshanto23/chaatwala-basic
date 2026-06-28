"use client"

import  { AboutHeader } from "@/components/about/about-header"
import { ContactSection } from "@/components/about/contact-us"
import { FaqSection } from "@/components/about/faq-section"
import { HistorySection } from "@/components/about/history"
import MapSection from "@/components/about/map-section"
import { OwnersTakeSection } from "@/components/about/owners-take"
import { VisionSection } from "@/components/about/vision"
import {
  Phone,
  Mail,
  MapPin
} from "lucide-react"

export default function AboutPage() {
  return (
    <main className="px-4 md:px-10 py-10 space-y-12  mx-auto">
      <section className="text-center space-y-3">
        <AboutHeader />
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
        <MapSection />
      </section>

      <section>
        <ContactSection />
      </section>
    </main>
  )
}