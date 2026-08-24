import AboutGalleryClient from "./AboutGalleryClient";
import { getGalleryImages } from "@/features/about-gallery/service";

export default async function AdminAboutPage() {
  const images = await getGalleryImages();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">About</h1>
        <p className="text-muted-foreground">Manage the public About page gallery.</p>
      </div>
      <AboutGalleryClient images={images} />
    </div>
  );
}
