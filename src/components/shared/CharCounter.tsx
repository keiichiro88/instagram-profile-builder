"use client";

import { countDisplayWidth } from "@/lib/char-count";
import { cn } from "@/lib/utils";

interface CharCounterProps {
  text: string;
  maxWidth: number;
  type: "line" | "total";
}

export function CharCounter({ text, maxWidth, type }: CharCounterProps) {
  const current =
    type === "line" ? countDisplayWidth(text) : [...text].length;

  const warningThreshold = type === "line" ? maxWidth - 3 : maxWidth - 15;

  const status =
    current > maxWidth ? "error" : current > warningThreshold ? "warning" : "ok";

  const unit = type === "line" ? "文字幅" : "文字";

  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums transition-colors",
        status === "ok" && "text-success",
        status === "warning" && "text-warning",
        status === "error" && "text-destructive"
      )}
    >
      {current}/{maxWidth}
      {unit}
    </span>
  );
}
