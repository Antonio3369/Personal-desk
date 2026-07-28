import { NextResponse } from "next/server";
import { requireModuleAccessForSession } from "@/lib/module-guard";
import type { ModuleKey } from "@/lib/modules";
import {
  getUploadImageFiles,
  saveUploadImages,
} from "@/lib/upload-images";
import type { UploadKind } from "@/lib/upload-image-url.shared";
import { getSessionPayload } from "@/lib/session";

const MODULE_BY_KIND: Record<UploadKind, ModuleKey> = {
  todos: "todos",
  notes: "notes",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params;
  if (kind !== "todos" && kind !== "notes") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getSessionPayload();
  const access = session
    ? await requireModuleAccessForSession(session, MODULE_BY_KIND[kind])
    : null;
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = getUploadImageFiles(formData);
    if (!files.length) {
      return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    }

    const paths = await saveUploadImages(kind, files);
    return NextResponse.json({ paths });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 400 },
    );
  }
}
