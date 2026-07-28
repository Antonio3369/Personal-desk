import { getUploadImageServeUrl } from "@/lib/upload-image-url-client";

export function AttachmentImageGallery({
  images,
  compact = false,
}: {
  images: { id: string; path: string }[];
  compact?: boolean;
}) {
  if (!images.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {images.map((image) => {
        const imageUrl = getUploadImageServeUrl(image.path);
        return (
          <a
            key={image.id}
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="附图"
              className={
                compact
                  ? "h-20 w-20 object-cover transition hover:opacity-90"
                  : "max-h-48 w-auto object-cover transition hover:opacity-90"
              }
            />
          </a>
        );
      })}
    </div>
  );
}
