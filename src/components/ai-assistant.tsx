"use client";

import { Bot, User, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const QUICK_ACTIONS = [
  { label: "总结要点", prompt: "帮我总结一下要点" },
  { label: "跟进话术", prompt: "帮我写一段跟进话术" },
  { label: "催办对方", prompt: "等待对方回复时，怎么礼貌催办？" },
  { label: "解释概念", prompt: "用简单的话解释一下这个概念：" },
] as const;

const WELCOME_MESSAGE =
  "你好，我是工作台 AI 助手。可以帮你总结文字、写跟进话术、整理思路。\n" +
  "试试下方快捷指令，或直接输入你的问题。";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 py-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function AiAssistant() {
  const panelId = useId();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: WELCOME_MESSAGE },
  ]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      textareaRef.current?.focus();
    }
  }, [open, messages, loading, scrollToBottom]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const resizeInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);
      resizeInput();

      const history = nextMessages
        .filter((message) => message.id !== "welcome")
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        const data = (await response.json()) as {
          reply?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "请求失败");
        }

        if (!data.reply) {
          throw new Error("AI 返回为空");
        }

        setMessages((current) => [
          ...current,
          { id: createId(), role: "assistant", content: data.reply! },
        ]);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "未知错误，请稍后再试";
        setMessages((current) => [
          ...current,
          { id: createId(), role: "assistant", content: `抱歉，出错了：${message}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, resizeInput],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 lg:bottom-6 lg:right-6">
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="AI 助手"
          className="pointer-events-auto mb-3 flex h-[min(520px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-[#f7f7f5] shadow-xl"
        >
          <div className="flex items-center justify-between bg-teal-900 px-5 py-4 text-white">
            <span className="text-sm font-semibold">AI 助手</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex max-w-[85%] gap-2.5",
                    isUser ? "ml-auto flex-row-reverse" : "",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      isUser ? "bg-teal-100 text-teal-800" : "bg-white text-teal-900 shadow-sm",
                    )}
                  >
                    {isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-xl px-3.5 py-2.5 text-sm leading-6 whitespace-pre-wrap break-words",
                      isUser
                        ? "rounded-br-sm bg-teal-900 text-white"
                        : "rounded-bl-sm border border-stone-200 bg-white text-stone-800 shadow-sm",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex max-w-[85%] gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-teal-900 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-xl rounded-bl-sm border border-stone-200 bg-white px-3.5 py-2.5 shadow-sm">
                  <TypingIndicator />
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-stone-200 px-4 py-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={loading}
                onClick={() => void sendMessage(action.prompt)}
                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition hover:border-teal-900 hover:bg-teal-900 hover:text-white disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2.5 border-t border-stone-200 px-4 py-3">
            <textarea
              ref={textareaRef}
              value={input}
              rows={1}
              disabled={loading}
              placeholder="输入消息，Enter 发送…"
              onChange={(event) => {
                setInput(event.target.value);
                resizeInput();
              }}
              onKeyDown={handleKeyDown}
              className="max-h-20 min-h-[42px] flex-1 resize-none rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-teal-900 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={loading || !input.trim()}
              onClick={() => void sendMessage(input)}
              className="rounded-xl bg-teal-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "关闭 AI 助手" : "打开 AI 助手"}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-900 text-white shadow-lg shadow-teal-900/30 transition hover:scale-105 hover:bg-teal-950"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
}
