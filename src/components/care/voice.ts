"use client";

/**
 * voice.ts — self-contained speech helpers for the Care Mode.
 *
 * There is no server-side STT/TTS provider key. These hooks wrap the browser's
 * Web Speech API (webkitSpeechRecognition + speechSynthesis), which is safe
 * offline and on any device. When the typed `lib/services/voice.ts` helpers
 * land you can swap the implementations out behind the same names — the UI
 * won't need to change.
 *
 * The hooks degrade gracefully: when the browser has no speech support we
 * simply return hasSupport=false and the record/play buttons hide themselves.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: SpeechResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechResultEvent = {
  results: SpeechResultList;
  resultIndex: number;
};

type SpeechResultList = {
  length: number;
  [i: number]: SpeechResult;
};

type SpeechResult = {
  isFinal: boolean;
  length: number;
  [i: number]: SpeechAlternative;
};

type SpeechAlternative = { transcript: string; confidence: number };

// ---------------------------------------------------------------------------
// Helpers: picks the first constructor the runtime exposes.
// ---------------------------------------------------------------------------

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (
    (w.SpeechRecognition as unknown as new () => SpeechRecognitionInstance) ??
    (w.webkitSpeechRecognition as unknown as new () => SpeechRecognitionInstance) ??
    null
  );
}

// ---------------------------------------------------------------------------
// useSpeechToText
// ---------------------------------------------------------------------------

export interface UseSpeechToTextReturn {
  isListening: boolean;
  transcript: string;
  finalTranscript: string;
  interimTranscript: string;
  error: string | null;
  hasSupport: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechToText(
  opts: { lang?: string; continuous?: boolean } = {},
): UseSpeechToTextReturn {
  const lang = opts.lang ?? "en-US";
  const continuous = opts.continuous ?? true;

  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasSupport = getSpeechRecognitionCtor() !== null;
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalRef = useRef("");

  const transcript = [finalTranscript, interimTranscript].filter(Boolean).join(" ");

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    setError(null);
    try {
      const instance = new Ctor();
      recognitionRef.current = instance;
      instance.lang = lang;
      instance.continuous = continuous;
      instance.interimResults = true;

      instance.onstart = () => setIsListening(true);
      instance.onend = () => setIsListening(false);
      instance.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "permission-denied") {
          setError("Microphone permission denied. Please allow access.");
        } else if (e.error === "no-speech") {
          setError(null);
        } else {
          setError(e.error === "aborted" ? null : `Speech error: ${e.error}`);
        }
      };
      instance.onresult = (event: SpeechResultEvent) => {
        let final = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          const text = r[0]?.transcript ?? "";
          if (r.isFinal) final += text + " ";
          else interim += text + " ";
        }
        if (final) {
          finalRef.current = (finalRef.current + " " + final).trim();
          setFinalTranscript(finalRef.current);
        }
        setInterimTranscript(interim.trim());
      };
      instance.start();
      setFinalTranscript(finalRef.current);
      setInterimTranscript("");
    } catch (e) {
      setError(String(e));
    }
  }, [lang, continuous]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const resetTranscript = useCallback(() => {
    finalRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort?.();
      } catch {
        /* noop */
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    interimTranscript,
    error,
    hasSupport,
    startListening,
    stopListening,
    resetTranscript,
  };
}

// ---------------------------------------------------------------------------
// useTextToSpeech
// ---------------------------------------------------------------------------

export interface UseTextToSpeechReturn {
  speak: (text: string, opts?: { rate?: number }) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, opts: { rate?: number } = {}) => {
      if (!isSupported || !text || !text.trim()) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = opts.rate ?? 0.92;
      u.pitch = 1;
      // Gentle, slightly slower voice — calm reading for dementia care
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      if (window.speechSynthesis.getVoices().length === 0) {
        // Some browsers need a tick before speaking — enqueue after voices ready
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.speak(u);
        };
      }
      window.speechSynthesis.speak(u);
    },
    [isSupported],
  );

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
  }, [isSupported]);

  // Heartbeat: speechSynthesis sometimes doesn't clear isSpeaking on its own
  useEffect(() => {
    if (!isSupported) return;
    const id = setInterval(() => {
      if (window.speechSynthesis) {
        const speaking = window.speechSynthesis.speaking;
        setIsSpeaking((prev) => (prev !== speaking ? speaking : prev));
      }
    }, 600);
    return () => clearInterval(id);
  }, [isSupported]);

  useEffect(() => {
    return () => {
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      } catch {
        /* noop */
      }
    };
  }, []);

  return { speak, pause, resume, cancel, isSpeaking, isSupported };
}
