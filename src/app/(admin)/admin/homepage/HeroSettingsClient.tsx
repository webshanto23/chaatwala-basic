"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateHeroSettings } from "@/features/site-settings/actions";
import { HERO_IMAGE_FALLBACK, type HeroSettings } from "@/features/site-settings/service";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function HeroSettingsClient({ settings }: { settings: HeroSettings }) {
  const router = useRouter();
  const [alt, setAlt] = useState(settings.imageAlt);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (image && !ALLOWED_TYPES.includes(image.type)) {
      setError("Only JPG, PNG, WEBP, or GIF images are allowed");
      return;
    }
    if (image && image.size > MAX_FILE_SIZE) {
      setError("Image must be 5MB or less");
      return;
    }

    const formData = new FormData();
    formData.set("heroImageAlt", alt);
    if (image) formData.set("image", image);

    startTransition(async () => {
      const result = await updateHeroSettings(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setImage(null);
      setSuccess("Hero settings saved.");
      router.refresh();
    });
  };

  return (
    <Card className="max-w-3xl border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardHeader>
        <CardTitle>Hero Section</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit}>
          {error && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {success && <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">{success}</p>}

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Current Hero Image</p>
            <div className="relative aspect-[21/16] max-w-xl overflow-hidden rounded-xl border border-border bg-muted">
              <Image src={settings.imageUrl ?? HERO_IMAGE_FALLBACK} alt={alt} fill className="object-cover" sizes="(min-width: 768px) 576px, 100vw" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="hero-image">Upload or replace image</label>
            <Input id="hero-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, or GIF. Maximum 5MB.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="hero-alt">Alt text</label>
            <Input id="hero-alt" value={alt} maxLength={160} onChange={(event) => setAlt(event.target.value)} required />
          </div>

          <Button type="submit" disabled={isPending}>
            <ImageUp className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : image ? "Replace Hero Image" : "Save Hero Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
