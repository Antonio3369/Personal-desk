"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getUploadImageServeUrl } from "@/lib/upload-image-url-client";
import { cn } from "@/lib/utils";

export function AttachmentImageGallery({
  images,
  compact = false,
}: {
  images: { id: string; path: string }[];
  compact?: boolean;
}) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => setActiveUrl(null), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activeUrl) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeUrl, close]);

  if (!images.length) {
    return null;
  }

  const lightbox =
    activeUrl && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="查看附图"
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/15 p-3 text-white ring-1 ring-white/25 transition hover:bg-white/25"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeUrl}
              alt="附图大图"
              className="max-h-[90vh] max-w-full object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {images.map((image) => {
          const imageUrl = getUploadImageServeUrl(image.path);
          return (
            <button
              key={image.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setActiveUrl(imageUrl);
              }}
              className="cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="附图"
                draggable={false}
                className={cn(
                  "pointer-events-none object-cover",
                  compact ? "h-20 w-20" : "max-h-48 w-auto",
                )}
              />
            </button>
          );
        })}
      </div>
      {lightbox}
    </>
  );
}
