import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Voice service abstraction: Speech-to-Text (STT) and Text-to-Speech (TTS).
 * Browser Web Speech API is used when available; `mockTranscribe` / `mockSpeak`
 * are deterministic stand-ins so the app stays runnable without credentials.
 *
 * The mock + helper functions are pure and safe; the two React hooks at the
 * bottom are client-only and imported from client components.
 */

const suggestions = [
  "I remember our trip to the beach — the sand, the sea, and the ice cream.",
  "My favourite song was playing on the radio that evening.",
  "We used to walk to the park every Sunday morning.",
  "The simplest things became the most beautiful memories.",
];

/** Wait a short, random amount of time to simulate the network. */
function delay(ms = 1200): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock speech-to-text. Picks a canned line so the flow is demo-able.
 */
export async function mockTranscribe(_audio?: Blob): Promise<string> {
  await delay(800 + Math.random() * 900);
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

/**
 * Single-shot mock TTS. Returns a speakable line.
 */
export async function mockSpeak(text: string): Promise<string> {
  await delay(400);
  return text;
}

// ---------------------------------------------------------------------------
// Browser Web Speech API helpers
// ---------------------------------------------------------------------------

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

export function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

type UseSpeechToTextResult = {
  listening: boolean;
  supported: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

/**
 * React hook wrapping the Web Speech API (or the mock when unsupported).
 */
export function useSpeechToText(options?: {
  onResult?: (transcript: string) => void;
  mock?: boolean;
}): UseSpeechToTextResult {
  // Always return runnable values; in a real client we wire the API.
  const mock = options?.mock ?? true;
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (mock) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      const e = event as { results?: ArrayLike<ArrayLike<{ transcript: string }>> };
      const results = e.results ?? [];
      let text = "";
      for (let i = 0; i < results.length; i++) {
        text += results[i][0]?.transcript ?? "";
      }
      setTranscript(text);
      options?.onResult?.(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => {
      rec.stop();
      recRef.current = null;
    };
  }, [mock]);

  const start = useCallback(async () => {
    if (!mock) {
      const rec = recRef.current;
      if (rec) {
        setListening(true);
        rec.onresult = (event) => {
          const e = event as { results?: ArrayLike<ArrayLike<{ transcript: string }>> };
          const results = e.results ?? [];
          let text = "";
          for (let i = 0; i < results.length; i++) {
            text += results[i][0]?.transcript ?? "";
          }
          setTranscript(text);
          options?.onResult?.(text);
        };
        rec.start();
        return;
      }
    }
    // Mock path: capture mic-less demo transcript.
    setListening(true);
    const text = await mockTranscribe();
    setTranscript(text);
    options?.onResult?.(text);
    setListening(false);
  }, [mock]);

  const stop = useCallback(() => {
    if (!mock) recRef.current?.stop();
    setListening(false);
  }, [mock]);

  const reset = useCallback(() => {
    setTranscript("");
  }, []);

  return { listening, supported: mock || getSpeechRecognitionCtor() !== null, transcript, start, stop, reset };
}

type UseTextToSpeechResult = {
  speaking: boolean;
  supported: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
};

/**
 * React hook wrapping the Web Speech API TTS (or a no-op mock).
 */
export function useTextToSpeech(options?: { rate?: number; mock?: boolean }): UseTextToSpeechResult {
  const mock = options?.mock ?? true;
  const [speaking, setSpeaking] = useState(false);

  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);

  const speak = useCallback(
    async (text: string) => {
      if (!mock) {
        const synth = getSpeechSynthesis();
        if (!synth) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options?.rate ?? 0.92;
        setSpeaking(true);
        cleanup.current = () => {
          synth.cancel();
          setSpeaking(false);
        };
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        synth.speak(utterance);
        return;
      }
      // Mock: just "play" the line for a moment.
      setSpeaking(true);
      window.setTimeout(() => setSpeaking(false), Math.min(2000, 600 + text.length * 30));
    },
    [mock],
  );

  const stop = useCallback(() => {
    cleanup.current?.();
    setSpeaking(false);
  }, []);

  return { speaking, supported: mock || typeof speechSynthesis !== "undefined", speak, stop };
}