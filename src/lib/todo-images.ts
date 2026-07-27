import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/todos");
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

export function getTodoImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);
}

export async function saveTodoImages(files: File[]) {
  if (!files.length) return [];

  const limited = files.slice(0, MAX_FILES);
  await mkdir(UPLOAD_DIR, { recursive: true });

  const paths: string[] = [];
  for (const file of limited) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error("仅支持 JPG、PNG、WebP、GIF 格式的图片");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("单张图片不能超过 5MB");
    }

    const ext = EXT_BY_TYPE[file.type] ?? ".jpg";
    const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
    const absolutePath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);
    paths.push(`/uploads/todos/${filename}`);
  }

  return paths;
}

export async function deleteTodoImageFiles(imagePaths: string[]) {
  await Promise.all(
    imagePaths.map(async (imagePath) => {
      if (!imagePath.startsWith("/uploads/todos/")) return;
      const absolutePath = path.join(process.cwd(), "public", imagePath);
      try {
        await unlink(absolutePath);
      } catch {
        // File may already be gone.
      }
    }),
  );
}
