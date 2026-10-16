const ARK_API_URL =
  "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

const DEFAULT_MODEL = "doubao-1-5-pro-32k-250115";

export type ArkMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function getArkModel() {
  return process.env.ARK_MODEL?.trim() || DEFAULT_MODEL;
}

export function requireArkApiKey() {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    throw new Error("AI 服务未配置，请联系管理员设置 ARK_API_KEY");
  }
  return apiKey;
}

export async function callArkChat(
  messages: ArkMessage[],
  options?: { temperature?: number },
): Promise<string> {
  const apiKey = requireArkApiKey();
  const model = getArkModel();

  const response = await fetch(ARK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    const detail = data.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`AI 请求失败：${detail}`);
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("AI 返回为空");
  }

  return reply;
}
