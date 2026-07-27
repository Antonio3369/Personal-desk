"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;

export function ImageUploadField({
  maxFiles = MAX_FILES,
  onChange,
  className,
}: {
  maxFiles?: number;
  onChange: (files: File[]) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  function updateFiles(nextFiles: File[]) {
    for (const url of previews) {
      URL.revokeObjectURL(url);
    }
    setFiles(nextFiles);
    setPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
    onChange(nextFiles);
  }

  function addFiles(nextFiles: FileList | null) {
    if (!nextFiles?.length) return;

    const merged = [...files];
    for (const file of Array.from(nextFiles)) {
      if (merged.length >= maxFiles) break;
      if (!file.type.startsWith("image/")) continue;
      merged.push(file);
    }
    updateFiles(merged);
  }

  function removeFile(index: number) {
    updateFiles(files.filter((_, i) => i !== index));
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= maxFiles}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-600 transition hover:border-stone-400 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4 stroke-[1.5]" />
          添加图片
        </button>
        <span className="text-xs text-stone-400">
          最多 {maxFiles} 张，单张不超过 5MB
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => addFiles(event.target.files)}
      />

      {previews.length ? (
        <div className="flex flex-wrap gap-3">
          {previews.map((preview, index) => (
            <div
              key={preview}
              className="relative h-24 w-24 overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={files[index]?.name ?? "待办图片预览"}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white transition hover:bg-black/70"
                aria-label="移除图片"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
