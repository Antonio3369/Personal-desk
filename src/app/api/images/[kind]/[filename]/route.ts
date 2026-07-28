import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { db } from "@/lib/db";
import { requireModuleAccessForSession } from "@/lib/module-guard";
import type { ModuleKey } from "@/lib/modules";
import {
  getUploadImageContentType,
  parseStoredUploadPath,
  resolveUploadImageAbsolutePath,
  type UploadKind,
} from "@/lib/upload-image-url";
import { getSessionPayload } from "@/lib/session";

const UPLOAD_ROOT = path.join(process.cwd(), "public/uploads");

const MODULE_BY_KIND: Record<UploadKind, ModuleKey> = {
  todos: "todos",
  notes: "notes",
};

async function assertImageOwnership(
  kind: UploadKind,
  storedPath: string,
  workspaceId: string,
) {
  if (kind === "todos") {
    return db.todoImage.findFirst({
      where: {
        path: storedPath,
        todo: { workspaceId },
      },
      select: { id: true },
    });
  }

  return db.noteImage.findFirst({
    where: {
      path: storedPath,
      note: { workspaceId },
    },
    select: { id: true },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; filename: string }> },
) {
  const { kind, filename } = await params;
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

  const decoded = decodeURIComponent(filename);
  if (!decoded || decoded.includes("/") || decoded.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storedPath = `/uploads/${kind}/${decoded}`;
  if (!parseStoredUploadPath(storedPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owned = await assertImageOwnership(kind, storedPath, access.workspaceId);
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const absolutePath = resolveUploadImageAbsolutePath(storedPath, UPLOAD_ROOT);
  if (!absolutePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(absolutePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": getUploadImageContentType(decoded),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
