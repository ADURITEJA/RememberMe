"use client";

/**
 * AssistantMessage — a calm chat bubble for the Remma assistant.
 *
 * The assistant's messages are large, warm and easy to read. Each user bubble
 * is right-aligned and each assistant bubble is left-aligned with an avatar.
 */

import { Bot, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AssistantMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export default function AssistantMessage({ message }: { message: AssistantMessageData }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex w-full items-start gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "text flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-remme-amber text-white" : "bg-remme-sage text-white",
        )}
        aria-hidden
      >
        {isUser ? <UserRound className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-3xl px-5 py-4 text-lg leading-relaxed whitespace-pre-line",
          isUser
            ? "bg-remme-sage text-white rounded-tr-md"
            : "glass-card text-remme-ink rounded-tl-md",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}