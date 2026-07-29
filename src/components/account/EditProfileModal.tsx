"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, Loader2, Save } from "lucide-react";
import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialImage: string;
};

export function EditProfileModal({
  open,
  onOpenChange,
  initialName,
  initialImage,
}: EditProfileModalProps) {
  const { data: session, update } = useSession();
  const [name, setName] = useState(initialName);
  const [imagePreview, setImagePreview] = useState(initialImage);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let imageUrl = imagePreview;

      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        const uploadRes = await fetch("/api/user/upload-image", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}));
          throw new Error(data.error || "Image upload failed");
        }
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: imageUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update profile");
      }

      const data = await res.json();
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.user.name,
          image: data.user.image,
        },
      });

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] bg-card p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-6">
          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Image */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                  {(name ?? "U")
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="profile-image" className="cursor-pointer">
                <Button variant="outline" size="sm" type="button" asChild>
                  <span>
                    <Camera className="mr-1.5 h-4 w-4" />
                    Change Photo
                  </span>
                </Button>
              </Label>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  {file.name}
                </p>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>

        <SheetFooter className="p-6 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}