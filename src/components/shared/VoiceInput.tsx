"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Mic } from "lucide-react";

interface VoiceInputProps {
  onResult: (transcript: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onResult, disabled = false }: VoiceInputProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    error,
  } = useSpeechRecognition();

  // Store onResult in ref to avoid stale closures and unnecessary effect runs
  const onResultRef: RefObject<typeof onResult> = useRef(onResult);
  onResultRef.current = onResult;

  // Track the previous transcript to detect new final results
  const prevTranscriptRef = useRef("");
  const isListeningRef = useRef(false);
  isListeningRef.current = isListening;

  // When transcript (final result) changes, send the new portion to parent
  useEffect(() => {
    // Guard: only process if we're actively listening (prevents re-send on effect ordering)
    if (!isListeningRef.current) return;
    if (transcript && transcript !== prevTranscriptRef.current) {
      const newText = transcript.slice(prevTranscriptRef.current.length);
      if (newText) {
        onResultRef.current(newText);
      }
      prevTranscriptRef.current = transcript;
    }
  }, [transcript]);

  // Reset ref when not listening
  useEffect(() => {
    if (!isListening) {
      prevTranscriptRef.current = "";
    }
  }, [isListening]);

  // Don't render if browser doesn't support Speech API
  if (!isSupported) return null;

  const handleToggle = () => {
    if (disabled) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={isListening ? "音声入力を停止" : "音声入力を開始"}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
          isListening
            ? "motion-safe:animate-pulse bg-red-500 text-white shadow-lg shadow-red-500/30"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <Mic className="h-5 w-5" />
      </button>
      <span className="text-xs text-muted-foreground">音声入力</span>

      {/* Interim result ghost text */}
      {isListening && interimTranscript && (
        <p className="mt-1 max-w-[200px] text-center text-xs text-muted-foreground/60">
          {interimTranscript}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 max-w-[200px] text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
