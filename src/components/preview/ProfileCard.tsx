"use client";

import { forwardRef } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { countDisplayWidth } from "@/lib/char-count";

interface ProfileCardProps {
  accountName: string;
  profileText: string;
  iconColor: string;
  combination: string | null;
}

const ProfileCard = forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ accountName, profileText, iconColor, combination }, ref) => {
    const lines = profileText.split("\n");
    const totalChars = [...profileText].length;
    const maxLineWidth = Math.max(...lines.map(countDisplayWidth), 0);

    const checks = [
      {
        label: `合計 ${totalChars}文字`,
        pass: totalChars <= 150,
        rule: "150文字以内",
      },
      {
        label: `最大行幅 ${maxLineWidth}`,
        pass: maxLineWidth <= 23,
        rule: "23文字/行以内",
      },
      {
        label: `${lines.length}行`,
        pass: lines.length <= 6,
        rule: "6行以内推奨",
      },
    ];

    return (
      <div
        ref={ref}
        className="mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${iconColor || "#F5A623"}, #1A1A2E)`,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2"/>
              <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2"/>
              <circle cx="18" cy="6" r="1.5" fill="white"/>
            </svg>
            <span className="text-sm font-medium text-white/90">Instagram Profile Builder</span>
          </div>
        </div>

        {/* Account */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              {accountName ? accountName.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                @{accountName || "username"}
              </div>
              {combination && (
                <div className="text-xs text-white/60">
                  {combination.split("→")[0]?.trim()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Text */}
        <div className="mx-4 rounded-xl bg-white/10 px-5 py-4 backdrop-blur-sm">
          <div className="space-y-0.5">
            {lines.map((line, i) => (
              <div key={i} className="flex gap-2">
                <span className="shrink-0 text-xs leading-[1.8] text-white/40">
                  {String(i + 1).padStart(2, " ")}
                </span>
                <span className="whitespace-pre-wrap text-sm leading-[1.8] text-white">
                  {line || "\u00A0"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Badges */}
        <div className="flex flex-wrap gap-2 px-6 pt-4 pb-6">
          {checks.map((c) => (
            <div
              key={c.rule}
              className="flex items-center gap-1 rounded-full px-3 py-1"
              style={{
                backgroundColor: c.pass
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
              }}
            >
              {c.pass ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-400" />
              )}
              <span
                className="text-xs font-medium"
                style={{ color: c.pass ? "#4ade80" : "#f87171" }}
              >
                {c.rule} {c.pass ? "OK" : "NG"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

ProfileCard.displayName = "ProfileCard";

export default ProfileCard;
