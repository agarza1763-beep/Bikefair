"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfilePhotoAction } from "@/server/actions/profile";

export function ProfilePhotoUploader({ currentImage, name, size = "lg" }: { currentImage: string | null; name: string; size?: "lg" | "sm" }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dimension = size === "lg" ? "h-20 w-20" : "h-10 w-10";

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const result = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/blob/upload-photo" });
      const res = await updateProfilePhotoAction(result.url);
      if (!res.ok) {
        setError(res.error);
      } else {
        setPreview(result.url);
        router.refresh();
      }
    } catch {
      setError("Photo upload failed. Try a smaller image or a different file.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className={`relative ${dimension} shrink-0 overflow-hidden rounded-full bg-charcoal-900`}>
        {preview ? (
          <Image src={preview} alt={name} fill className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-white">{name.charAt(0)}</span>
        )}
      </div>
      <div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Camera className="h-4 w-4" /> {uploading ? "Uploading…" : preview ? "Change photo" : "Add profile photo"}
        </Button>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
