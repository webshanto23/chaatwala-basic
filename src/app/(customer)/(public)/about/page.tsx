import { AboutHeader } from "@/components/about/about-header";
import { ContactSection } from "@/components/about/contact-us";
import { FaqSection } from "@/components/about/faq-section";
import { HistorySection } from "@/components/about/history";
import MapSection from "@/components/about/map-section";
import { OwnersTakeSection } from "@/components/about/owners-take";
import { VisionSection } from "@/components/about/vision";
import { MetricsStrip } from "@/components/home/MetricsStrip";
import { WhyChaatwala } from "@/components/home/WhyChaatwala";
import { GallerySection } from "@/components/about/GallerySection";
import { getGalleryImages } from "@/features/about-gallery/service";

export default async function AboutPage() {
  const galleryImages = await getGalleryImages();

  return (
    <main className="w-full min-h-screen  bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10 font-sans">
      <div className="max-w-7xl mx-auto space-y-12 py-12 px-4 sm:px-6 lg:px-8">
        <section className="text-center space-y-3">
          <AboutHeader />
        </section>
        <section>
          <WhyChaatwala />
          <GallerySection images={galleryImages} />
        </section>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HistorySection />
          <VisionSection />
          <OwnersTakeSection />
        </section>

        <section className="">
          <FaqSection />
        </section>
        <section className="">
          <MetricsStrip />
        </section>
        <section className="">
          <MapSection />
        </section>

        <section className="">
          <ContactSection />
        </section>
      </div>
    </main>
  );
}
