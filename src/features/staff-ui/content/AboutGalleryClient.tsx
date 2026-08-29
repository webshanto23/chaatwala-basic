"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteGalleryImage, uploadGalleryImage } from "@/features/about-gallery/actions";
import type { GalleryImage } from "@/features/about-gallery/service";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AboutGalleryClient({ images }: { images: GalleryImage[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const upload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("Image is required");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
      setError("Choose a JPG, PNG, WEBP, or GIF image up to 5MB");
      return;
    }

    const formData = new FormData();
    formData.set("image", file);
    formData.set("alt", alt);
    startTransition(async () => {
      const result = await uploadGalleryImage(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setFile(null);
      setAlt("");
      setSuccess("Gallery image uploaded.");
      router.refresh();
    });
  };

  const remove = (id: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await deleteGalleryImage(id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess("Gallery image removed.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-3xl border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <CardHeader><CardTitle>Add Gallery Image</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={upload}>
            {error && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {success && <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">{success}</p>}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="gallery-image">Image</label>
              <Input id="gallery-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, or GIF. Maximum 5MB.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="gallery-alt">Alt text</label>
              <Input id="gallery-alt" value={alt} maxLength={160} required onChange={(event) => setAlt(event.target.value)} />
            </div>
            <Button type="submit" disabled={isPending}><ImagePlus className="mr-2 h-4 w-4" />{isPending ? "Saving..." : "Upload Image"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <CardHeader>
          <CardTitle>Uploaded Gallery Images</CardTitle>
          <p className="text-sm text-muted-foreground">{images.length} image{images.length === 1 ? "" : "s"} saved in the gallery.</p>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? <p className="text-sm text-muted-foreground">No uploaded images yet. The public page is using its built-in fallback gallery.</p> : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {images.map((image) => (
                <div key={image.id} className="min-w-0 space-y-1.5">
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                    <Image src={image.src} alt={image.alt} fill className="object-cover" sizes="(min-width: 1024px) 11vw, (min-width: 640px) 18vw, 30vw" />
                  </div>
                  <p className="truncate text-xs text-muted-foreground" title={image.alt}>{image.alt}</p>
                  <Button type="button" variant="destructive" size="sm" className="w-full px-2 text-xs" onClick={() => remove(image.id)} disabled={isPending}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
