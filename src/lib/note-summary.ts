import { callArkChat } from "@/lib/ark";
import { buildNoteSourceText } from "@/lib/note-summary-source";

const SUMMARY_SYSTEM_PROMPT =
  "你是 Personal Desk 笔记助手。根据用户提供的笔记内容，生成简洁的中文摘要。" +
  "优先用 3-5 句话概括；若信息较多，可用短要点列表。" +
  "只输出摘要正文，不要寒暄、不要标题前缀。";

export { buildNoteSourceText, hasNoteSummarySource } from "@/lib/note-summary-source";
export type { NoteSummarySource } from "@/lib/note-summary-source";

export async function generateSummaryFromSource(sourceText: string) {
  return callArkChat(
    [
      { role: "system", content: SUMMARY_SYSTEM_PROMPT },
      {
        role: "user",
        content: `请为以下笔记生成摘要：\n\n${sourceText}`,
      },
    ],
    { temperature: 0.4 },
  );
}
