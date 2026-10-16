import { NextResponse } from "next/server";
import { callArkChat } from "@/lib/ark";
import { getSessionPayload } from "@/lib/session";
import { requireActiveUserSession } from "@/lib/module-guard";

const SYSTEM_PROMPT =
  "你是 Personal Desk 工作台的 AI 助手，帮助用户整理笔记、跟进待办和维护人脉。" +
  "回答简洁实用，优先给出可执行的建议。若信息不足，先说明需要补充什么。";

const MAX_MESSAGES = 30;
const MAX_CONTENT_LENGTH = 8_000;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function isValidMessages(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return false;
  }

  return value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.trim().length > 0 &&
      item.content.length <= MAX_CONTENT_LENGTH,
  );
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  const activeSession = await requireActiveUserSession(session);
  if (!activeSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages =
    body &&
    typeof body === "object" &&
    "messages" in body &&
    isValidMessages(body.messages)
      ? body.messages
      : null;

  if (!messages) {
    return NextResponse.json({ error: "消息格式无效" }, { status: 400 });
  }

  try {
    const reply = await callArkChat([
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ]);

    return NextResponse.json({ reply });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 服务暂时不可用";
    const status = message.includes("未配置") ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
