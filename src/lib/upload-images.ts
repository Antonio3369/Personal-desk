import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import {
  getUploadPrefix,
  resolveUploadImageAbsolutePath,
  type UploadKind,
} from "@/lib/upload-image-url";

export {
  getTodoImageServeUrl,
  getUploadImageServeUrl,
} from "@/lib/upload-image-url";

export type { UploadKind } from "@/lib/upload-image-url";

const UPLOAD_ROOT = path.join(process.cwd(), "public/uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

function inferImageType(file: File) {
  if (file.type && ALLOWED_TYPES.has(file.type)) {
    return file.type;
  }

  const ext = path.extname(file.name).toLowerCase();
  const extToType: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".heic": "image/heic",
    ".heif": "image/heif",
  };

  return extToType[ext] ?? "";
}

export function getUploadImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);
}

/** @deprecated Use getUploadImageFiles */
export const getTodoImageFiles = getUploadImageFiles;

export async function saveUploadImages(kind: UploadKind, files: File[]) {
  if (!files.length) return [];

  const uploadDir = path.join(UPLOAD_ROOT, kind);
  const limited = files.slice(0, MAX_FILES);
  await mkdir(uploadDir, { recursive: true });

  return Promise.all(
    limited.map(async (file) => {
      const imageType = inferImageType(file);
      if (!imageType) {
        throw new Error("仅支持 JPG、PNG、WebP、GIF、HEIC 格式的图片");
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("单张图片不能超过 5MB");
      }

      const ext = EXT_BY_TYPE[imageType] ?? ".jpg";
      const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
      const absolutePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(absolutePath, buffer);
      return `${getUploadPrefix(kind)}${filename}`;
    }),
  );
}

/** @deprecated Use saveUploadImages("todos", files) */
export async function saveTodoImages(files: File[]) {
  return saveUploadImages("todos", files);
}

export async function deleteUploadImageFiles(imagePaths: string[]) {
  await Promise.all(
    imagePaths.map(async (imagePath) => {
      const absolutePath = resolveUploadImageAbsolutePath(imagePath, UPLOAD_ROOT);
      if (!absolutePath) return;
      try {
        await unlink(absolutePath);
      } catch {
        // File may already be gone.
      }
    }),
  );
}

/** @deprecated Use deleteUploadImageFiles */
export const deleteTodoImageFiles = deleteUploadImageFiles;
