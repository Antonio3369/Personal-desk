import type { UploadKind } from "@/lib/upload-image-url.shared";
import { compressImageFiles } from "@/lib/compress-image-client";
import { getImageFilesFromFormData } from "@/components/image-upload-field";

export function stripImageFilesFromFormData(formData: FormData) {
  formData.delete("images");
}

/** Build FormData safe for Next.js server actions (no File blobs). */
export function formDataForServerAction(source: FormData): FormData {
  const next = new FormData();
  for (const [key, value] of source.entries()) {
    if (key === "images" || value instanceof File) {
      continue;
    }
    next.append(key, value);
  }
  return next;
}

export async function uploadImagesFromForm(
  kind: UploadKind,
  formData: FormData,
): Promise<string[]> {
  const files = getImageFilesFromFormData(formData);
  if (!files.length) {
    return [];
  }

  const compressed = await compressImageFiles(files);

  const body = new FormData();
  for (const file of compressed) {
    body.append("images", file);
  }

  const response = await fetch(`/api/uploads/${kind}`, {
    method: "POST",
    body,
  });

  const payload = (await response.json().catch(() => null)) as
    | { paths?: string[]; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "图片上传失败");
  }

  return payload?.paths ?? [];
}
