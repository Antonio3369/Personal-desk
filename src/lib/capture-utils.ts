import { NOTE_TYPES, type NoteType } from "@/lib/constants";

export function captureDescription(type: string) {
  if (type === "learning") {
    return "贴链接、选标签，摘要可以后面在笔记页补。";
  }
  if (type === "opinion" || type === "inspiration") {
    return `先记下${NOTE_TYPES[type as NoteType]}，城市和人脉可以后面再补。`;
  }
  if (type === "personal") {
    return "个人事务同样支持标签和跟进日期。";
  }
  return "先记内容，城市、人脉和标签都可以后面再补。";
}
