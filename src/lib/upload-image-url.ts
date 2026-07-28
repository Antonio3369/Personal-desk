import path from "path";
import {
  getUploadPrefix,
  UPLOAD_KINDS,
  type UploadKind,
} from "@/lib/upload-image-url.shared";

export { getUploadPrefix, UPLOAD_KINDS, type UploadKind } from "@/lib/upload-image-url.shared";

export function getUploadImageServeUrl(storedPath: string) {
  for (const kind of UPLOAD_KINDS) {
    const prefix = getUploadPrefix(kind);
    if (storedPath.startsWith(prefix)) {
      const filename = storedPath.slice(prefix.length);
      return `/api/images/${kind}/${encodeURIComponent(filename)}`;
    }
  }
  return storedPath;
}

/** @deprecated Use getUploadImageServeUrl */
export const getTodoImageServeUrl = getUploadImageServeUrl;

export function getUploadImageContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  const contentTypeByExt: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".heic": "image/heic",
    ".heif": "image/heif",
  };

  return contentTypeByExt[ext] ?? "application/octet-stream";
}

export function parseStoredUploadPath(storedPath: string) {
  for (const kind of UPLOAD_KINDS) {
    const prefix = getUploadPrefix(kind);
    if (!storedPath.startsWith(prefix)) continue;

    const filename = path.basename(storedPath);
    if (!filename || filename === "." || filename.includes("..")) {
      return null;
    }

    return { kind, filename };
  }

  return null;
}

export function resolveUploadImageAbsolutePath(
  storedPath: string,
  uploadRoot = path.join(process.cwd(), "public/uploads"),
) {
  const parsed = parseStoredUploadPath(storedPath);
  if (!parsed) return null;
  return path.join(uploadRoot, parsed.kind, parsed.filename);
}
