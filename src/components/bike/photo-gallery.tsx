"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";

export function PhotoGallery({ images, title }: { images: { url: string; altText?: string | null }[]; title: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-charcoal-50 text-charcoal-300">No photos</div>;
  }

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-charcoal-50">
        <Image src={images[active].url} alt={images[active].altText ?? title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={clsx("relative aspect-square overflow-hidden rounded-lg border-2", i === active ? "border-green-600" : "border-transparent")}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
