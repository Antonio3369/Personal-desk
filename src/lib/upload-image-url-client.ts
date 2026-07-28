import { UPLOAD_KINDS } from "@/lib/upload-image-url.shared";

export function getUploadImageServeUrl(storedPath: string) {
  for (const kind of UPLOAD_KINDS) {
    const prefix = `/uploads/${kind}/`;
    if (storedPath.startsWith(prefix)) {
      const filename = storedPath.slice(prefix.length);
      return `/api/images/${kind}/${encodeURIComponent(filename)}`;
    }
  }
  return storedPath;
}
