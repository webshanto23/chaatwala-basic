import AboutGalleryClient from "@/features/staff-ui/content/AboutGalleryClient";
import { getGalleryImages } from "@/features/about-gallery/service";
import { requireSuperAdmin } from "@/lib/authorize";
import { redirect } from "next/navigation";

export default async function StaffAboutPage() {
  if (!(await requireSuperAdmin()).authorized) redirect("/access-denied");
  const images = await getGalleryImages();
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-foreground md:text-3xl">About</h1><p className="text-muted-foreground">Manage the public About page gallery.</p></div><AboutGalleryClient images={images} /></div>;
}
