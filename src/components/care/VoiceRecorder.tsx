"use client";

/**
 * VoiceRecorder — the "tell me what happened" recorder used on the Share a
 * memory page (and reusable anywhere in care mode).
 *
 * The button pulses while listening, final transcripts stream into the
 * onTranscribe callback (auto-filling the "What happened?" text), and the raw
 * audio is captured as a data-URL so it can be stored as MemoryMedia(VOICE).
 */

import { useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/components/care/voice";

interface MediaRecorderLike {
  state: string;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onstop: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function startAudioRecorder(): Promise<{
  recorder: MediaRecorderLike;
  stream: MediaStream;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      reject(new Error("Microphone recording is not supported in this browser."));
      return;
    }
    void navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const Rec = window.MediaRecorder as typeof MediaRecorder | undefined;
        if (!Rec) {
          stream.getTracks().forEach((t) => t.stop());
          reject(new Error("Audio recording is not available here."));
          return;
        }
        const recorder = new Rec(stream);
        resolve({ recorder: recorder as unknown as MediaRecorderLike, stream });
      })
      .catch(() => {
        reject(new Error("Microphone access was blocked. Please allow it and try again."));
      });
  });
}

export interface VoiceRecorderProps {
  onTranscribe: (finalText: string) => void;
  onAudio: (dataUrl: string) => void;
  placeholder?: string;
}

export default function VoiceRecorder({
  onTranscribe,
  onAudio,
  placeholder = "Tap and tell me what happened…",
}: VoiceRecorderProps) {
  const stt = useSpeechToText({ lang: "en-US", continuous: true });
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorderLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [recorderError, setRecorderError] = useState<string | null>(null);

  const clear = () => {
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setAudioDataUrl(null);
    setRecordingAudio(false);
    setRecorderError(null);
    stt.resetTranscript();
    if (onAudio) onAudio("");
  };

  const stopEverything = () => {
    try {
      recorderRef.current?.stop();
    } catch {
      /* noop */
    }
    stt.stopListening();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecordingAudio(false);
  };

  const handleToggle = async () => {
    setRecorderError(null);

    // Stop the previous recording completely to save the captured clip.
    stopEverything();

    const wasRecording = stt.isListening || recorderRef.current !== null;
    if (wasRecording) {
      return;
    }

    // Start speech-to-text (live transcript stream)
    stt.resetTranscript();

    // Start audio capture (raw recording -> data URL)
    try {
      const { recorder, stream } = await startAudioRecorder();
      recorderRef.current = recorder;
      streamRef.current = stream;
      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size === 0) return;
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result as string;
          setAudioDataUrl(url);
          if (onAudio) onAudio(url);
        };
        reader.onerror = () => setRecorderError("Could not save the recording.");
        reader.readAsDataURL(event.data);
      };
      recorder.onerror = () => {
        setRecorderError("Something stopped the recording. Please try again.");
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecordingAudio(true);
    } catch (e) {
      setRecorderError(e instanceof Error ? e.message : "Couldn't start recording.");
      // Even without audio capture we keep STT running so the transcript text is usable.
      stt.startListening();
      return;
    }

    stt.startListening();
  };

  // When speech-to-text stops, push the final transcript to the parent once.
  const lastFinalRef = useRef(false);
  if (!stt.isListening && stt.finalTranscript && !lastFinalRef.current) {
    lastFinalRef.current = true;
    if (onTranscribe) onTranscribe(stt.finalTranscript);
  }
  if (stt.isListening) lastFinalRef.current = false;

  const isBusy = stt.isListening || recordingAudio;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleToggle()}
          aria-label={
            isBusy ? "Stop recording and save this" : "Start recording this memory"
          }
          aria-pressed={isBusy}
          className={cn(
            "relative inline-flex min-h-16 items-center gap-3 rounded-full px-6 font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-remme-sage/40 min-touch",
            isBusy
              ? "bg-remme-status-emergency text-white"
              : "bg-remme-sage text-white hover:bg-remme-sage-deep",
          )}
        >
          {/* calm pulsing ring while listening */}
          {stt.isListening ? (
            <span
              aria-hidden
              className="absolute inset-0 -z-0 rounded-full bg-remme-sage/40 animate-ping"
            />
          ) : null}
          {isBusy ? (
            <Square aria-hidden className="relative h-6 w-6 fill-current" />
          ) : (
            <Mic aria-hidden className="relative h-6 w-6" />
          )}
          <span className="relative">
            {stt.isListening
              ? stt.interimTranscript
                ? "Listening…"
                : "Listening… say it out loud"
              : audioDataUrl
              ? "Re-record"
              : placeholder}
          </span>
        </button>

        {audioDataUrl ? (
          <span className="inline-flex min-h-12 items-center gap-2 rounded-full bg-remme-sage/10 px-4 text-sm font-medium text-remme-sage-deep">
            🎙️ Clip saved
          </span>
        ) : null}

        {(audioDataUrl || stt.finalTranscript) ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear recording"
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/5 text-remme-ink/60 hover:bg-black/10"
          >
            <Trash2 aria-hidden className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {recorderError ? (
        <p role="alert" className="rounded-xl bg-remme-status-emergency/10 px-4 py-3 text-base font-medium text-remme-status-emergency">
          {recorderError}
        </p>
      ) : null}
      {stt.error ? (
        <p role="alert" className="rounded-xl bg-remme-status-attention/10 px-4 py-3 text-base font-medium text-remme-status-attention">
          {stt.error}
        </p>
      ) : null}

      {audioDataUrl ? (
        <audio controls src={audioDataUrl} className="w-full max-w-sm rounded-xl" preload="none">
          Your browser doesn&apos;t support audio playback.
        </audio>
      ) : null}
    </div>
  );
}