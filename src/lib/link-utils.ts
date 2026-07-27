import { detectPlatformFromUrl, type NotePlatform } from "@/lib/constants";

export function normalizeLearningLink(raw: string): {
  link: string;
  platform: NotePlatform;
} | null {
  const text = raw.trim();
  if (!text) return null;

  const httpMatch = text.match(/https?:\/\/[^\s\u4e00-\u9fff，。！？）)]+/i);
  if (httpMatch) {
    const link = httpMatch[0].replace(/[.,;:!?)]+$/, "");
    return { link, platform: detectPlatformFromUrl(link) };
  }

  const douyinPath = text.match(/v\.douyin\.com\/([A-Za-z0-9_/-]+)/i);
  if (douyinPath) {
    const link = `https://v.douyin.com/${douyinPath[1].replace(/\/$/, "")}/`;
    return { link, platform: "douyin" };
  }

  const douyinSlashCode = text.match(
    /([A-Za-z0-9_-]+\/[A-Za-z0-9_-]+)\/?\s*(?:复制|打开)/,
  );
  if (douyinSlashCode) {
    return {
      link: `https://v.douyin.com/${douyinSlashCode[1]}/`,
      platform: "douyin",
    };
  }

  const douyinShareCode = text.match(
    /([A-Za-z0-9_-]{4,30})\/?\s*(?:复制此链接|复制打开|打开Dou?音|打开抖音)/i,
  );
  if (douyinShareCode) {
    return {
      link: `https://v.douyin.com/${douyinShareCode[1]}/`,
      platform: "douyin",
    };
  }

  if (/douyin|抖音|dou音/i.test(text)) {
    const code = text.match(/([A-Za-z0-9_-]{4,30})\/?/);
    if (code) {
      return {
        link: `https://v.douyin.com/${code[1]}/`,
        platform: "douyin",
      };
    }
  }

  const domainLike = text.match(/^([a-z0-9.-]+\.[a-z]{2,}[^\s]*)/i);
  if (domainLike) {
    const link = domainLike[1].startsWith("http")
      ? domainLike[1]
      : `https://${domainLike[1]}`;
    return { link, platform: detectPlatformFromUrl(link) };
  }

  return null;
}

export function isLikelyShareText(raw: string) {
  return /复制|打开Dou?音|打开抖音|v\.douyin|douyin\.com|mp\.weixin\.qq\.com/i.test(
    raw,
  );
}
