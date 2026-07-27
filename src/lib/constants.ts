export const CITIES = [
  "深圳",
  "武汉",
  "南京",
  "宁波",
  "泉州",
  "福州",
  "厦门",
  "香港",
] as const;

export const TODO_SCOPES = {
  work: "工作",
  personal: "个人",
} as const;

export const TODO_PROGRESS = {
  not_started: "未开始",
  in_progress: "进行中",
  waiting: "等待对方",
  deferred: "等合适时机",
  done: "已完成",
} as const;

export const TODO_NATURE = {
  follow_up: "推事跟进",
  instruction: "收到指令",
  personal: "个人事务",
  cross_city: "跨城专项",
} as const;

export const RELATION_TYPES = ["团队", "客户", "伙伴", "同事"] as const;

export type TodoScope = keyof typeof TODO_SCOPES;
export type TodoProgress = keyof typeof TODO_PROGRESS;

export const NOTE_TYPES = {
  learning: "学习",
  opinion: "观点",
  inspiration: "灵感",
} as const;

export type NoteType = keyof typeof NOTE_TYPES;

export const NOTE_PLATFORMS = {
  wechat: "公众号",
  douyin: "抖音",
  youtube: "YouTube",
  book: "读书",
  course: "课程",
  other: "其他",
} as const;

export type NotePlatform = keyof typeof NOTE_PLATFORMS;

export const READ_STATUS = {
  unread: "未读",
  read: "已读",
} as const;

export type ReadStatus = keyof typeof READ_STATUS;

export function detectPlatformFromUrl(url: string): NotePlatform {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "youtube";
  }
  if (lower.includes("douyin.com")) {
    return "douyin";
  }
  if (lower.includes("mp.weixin.qq.com") || lower.includes("weixin")) {
    return "wechat";
  }
  return "other";
}
