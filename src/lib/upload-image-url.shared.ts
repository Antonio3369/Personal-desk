export const UPLOAD_KINDS = ["todos", "notes"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export function getUploadPrefix(kind: UploadKind) {
  return `/uploads/${kind}/`;
}
