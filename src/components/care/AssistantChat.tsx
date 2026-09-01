"use client";

/**
 * AssistantChat — a calm, full-screen chat with Remma.
 *
 * Text input + mic button (useSpeechToText) + send. Assistant messages are
 * auto-spoken aloud via TTS. Keeps a gentle conversational pace.
 */

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Sparkles, Bot, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpeechToText, useTextToSpeech } from "@/components/care/voice";
import AssistantMessage, { type AssistantMessageData } from "@/components/care/AssistantMessage";

interface AssistantChatProps {
  userName: string;
}

export default function AssistantChat({ userName }: AssistantChatProps) {
  const [messages, setMessages] = useState<AssistantMessageData[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const stt = useSpeechToText({ lang: "en-US", continuous: true });
  const tts = useTextToSpeech();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // First message (welcome)
  useEffect(() => {
    if (messages.length === 0) {
      const welcome = `Hello, ${userName}! I'm Remma — your calm companion. I can help you remember the little things, retell your memories, find a face, check your mood, or just listen. What would you like to talk about today? 💛`;
      setMessages([{ id: "welcome", role: "assistant", content: welcome, createdAt: new Date().toISOString() }]);
    }
  }, [userName, messages.length]);

  // Auto-speak assistant messages
  useEffect(() => {
    if (!tts.isSupported) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && !last.id.startsWith("temp")) {
      tts.speak(last.content, { rate: 0.9 });
    }
  }, [messages, tts.isSupported]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle voice -> input stream
  useEffect(() => {
    if (!stt.isListening && stt.finalTranscript.trim()) {
      setInput((prev) => (prev ? prev + " " : "") + stt.finalTranscript.trim());
      stt.resetTranscript();
    }
  }, [stt.isListening, stt.finalTranscript, stt]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    setBusy(true);

    const userMsg: AssistantMessageData = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const text = input.trim();
    setInput("");

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "I'm having a little trouble — can we try again in a moment?",
            createdAt: new Date().toISOString(),
          },
        ]);
        setBusy(false);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `assist-${Date.now()}`,
          role: "assistant",
          content: data.message,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't reach the server. Please try again in a moment.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleMic = () => {
    if (stt.isListening) {
      stt.stopListening();
    } else {
      stt.startListening();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-remme-offwhite/90 backdrop-blur-xl border-b border-black/5">
        <div className="flex min-h-10 w-10 items-center justify-center rounded-full bg-remme-sage text-white shrink-0">
          <Bot aria-hidden className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold leading-tight text-remme-ink">Remma</h1>
          <span className="text-sm text-remme-ink/55">Your calm companion</span>
        </div>
        <div className="flex-1" />
        <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-remme-sage/10 px-3 text-sm font-medium text-remme-sage-deep">
          <Sparkles aria-hidden className="h-3 w-3" /> Always honest
        </span>
      </header>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <AssistantMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice transcript preview */}
      {(stt.finalTranscript || stt.interimTranscript) && (
        <div className="px-4 pb-2 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-remme-sage/10 px-3 py-1.5 text-sm text-remme-sage-deep">
            <Mic aria-hidden className="h-4 w-4" />
            {stt.interimTranscript ? (
              <span className="italic">{stt.interimTranscript}</span>
            ) : (
              <span>“{stt.finalTranscript}”</span>
            )}
          </span>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="mx-auto w-full max-w-3xl px-4 pb-6"
      >
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={handleMic}
            aria-label={stt.isListening ? "Stop listening" : "Start voice recording"}
            className={cn(
              "flex min-h-12 min-w-12 items-center justify-center rounded-full transition-colors min-touch",
              stt.isListening
                ? "bg-remme-status-emergency text-white animate-pulse"
                : "bg-remme-sage text-white hover:bg-remme-sage-deep",
            )}
          >
            {stt.isListening ? (
              <Square aria-hidden className="h-6 w-6 fill-current" />
            ) : (
              <Mic aria-hidden className="h-6 w-6" />
            )}
          </button>

          <label htmlFor="assistant-input" className="sr-only">
            Talk to Remma
          </label>
          <input
            id="assistant-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or tap the microphone…"
            disabled={busy}
            className="flex-1 min-h-12 rounded-2xl border-2 border-remme-sage/15 bg-white/80 px-5 py-3 text-lg text-remme-ink placeholder:text-remme-ink/40 focus:border-remme-sage focus:outline-none focus:ring-4 focus:ring-remme-sage/25"
          />

          <Button
            type="submit"
            variant="sage"
            size="lg"
            disabled={!input.trim() || busy}
            isLoading={busy}
            className="min-touch"
            aria-label={busy ? "Sending…" : "Send to Remma"}
          >
            <Send aria-hidden className="h-5 w-5" />
          </Button>
        </div>
      </form>

      {/* Warm footer */}
      <div className="flex flex-col items-center gap-1 px-4 pb-4 text-center">
        <p className="text-sm text-remme-ink/50">
          I only ever share what you've already told me — I never guess. 💛
        </p>
      </div>
    </div>
  );
}