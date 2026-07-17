"use client";

import { FormEvent, useRef, useState } from "react";
import { Bot, Send, Sparkles, Square, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTER_PROMPTS = [
  "Gợi ý học phần đang mở và còn chỗ",
  "Tôi muốn học thêm về backend và microservices",
  "Các học phần phổ biến nhất hiện nay là gì?"
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function CourseAdvisorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Chào bạn, mình là AI Course Advisor. Hãy hỏi về học phần, gợi ý môn phù hợp, học phần phổ biến hoặc các môn bạn đã đăng ký."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function sendMessage(messageText = input) {
    const content = messageText.trim();

    if (!content || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content
    };
    const assistantMessage: ChatMessage = {
      id: createId(),
      role: "assistant",
      content: ""
    };
    const nextMessages = [...messages, userMessage, assistantMessage];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch("/api/ai/course-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.content.trim().length > 0)
            .map((message) => ({
              role: message.role,
              content: message.content
            }))
        }),
        signal: abortController.signal
      });

      if (!response.ok || !response.body) {
        throw new Error("Không thể kết nối AI Course Advisor.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        fullText += decoder.decode(value, { stream: true });
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content: fullText
                }
              : message
          )
        );
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? error.message
                    : "Đã xảy ra lỗi khi gọi AI Course Advisor."
              }
            : message
        )
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setIsLoading(false);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>AI Course Advisor</CardTitle>
            <CardDescription>
              Hỏi đáp học phần bằng tiếng Việt, có RAG search và tool đọc dữ
              liệu course.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void sendMessage(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <div className="h-[520px] space-y-4 overflow-y-auto rounded-md border bg-muted/20 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" ? (
                <div className="mt-1 rounded-md bg-primary/10 p-2 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
              ) : null}

              <div
                className={cn(
                  "max-w-[82%] whitespace-pre-wrap rounded-md px-4 py-3 text-sm leading-6",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background"
                )}
              >
                {message.content || "Đang suy nghĩ..."}
              </div>

              {message.role === "user" ? (
                <div className="mt-1 rounded-md bg-secondary p-2">
                  <User className="h-4 w-4" />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ví dụ: Tôi muốn học về distributed systems, nên đăng ký môn nào?"
            className="min-h-11 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isLoading}
            rows={2}
          />
          {isLoading ? (
            <Button type="button" variant="outline" onClick={stopStreaming}>
              <Square className="h-4 w-4" />
              Dừng
            </Button>
          ) : (
            <Button type="submit" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
              Gửi
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
