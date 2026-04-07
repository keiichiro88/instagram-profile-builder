"use client";

import { forwardRef, useState } from "react";
import { Camera, Grid3X3, Heart, Bookmark, User } from "lucide-react";

interface InstagramMockupProps {
  accountName: string;
  profileText: string;
  iconColor: string;
  showFace: boolean | null;
  darkMode?: boolean;
  compact?: boolean;
}

const InstagramMockup = forwardRef<HTMLDivElement, InstagramMockupProps>(
  ({ accountName, profileText, iconColor, showFace, darkMode = false, compact = false }, ref) => {
    const [expanded, setExpanded] = useState(false);

    const displayName = accountName || "username";
    const initial = displayName.charAt(0).toUpperCase();
    const lines = profileText.split("\n");
    const shouldTruncate = !expanded && lines.length > 3;
    const displayLines = shouldTruncate ? lines.slice(0, 3) : lines;

    // Color scheme — matches real Instagram CSS tokens
    const bg = darkMode ? "bg-black" : "bg-white";
    const textPrimary = darkMode ? "text-[#E4E6EB]" : "text-[#262626]";
    const textSecondary = darkMode ? "text-[#B0B3B8]" : "text-[#8E8E8E]";
    const border = darkMode ? "border-[#262626]" : "border-[#DBDBDB]";
    const borderLight = darkMode ? "border-[#262626]" : "border-[#EFEFEF]";
    const btnBg = darkMode ? "bg-[#363636]" : "bg-[#EFEFEF]";
    const highlightBg = darkMode ? "bg-[#1a1a1a]" : "bg-gray-50";
    const highlightBorder = darkMode ? "border-[#262626]" : "border-[#DBDBDB]";
    const gridBg = darkMode ? "bg-[#1a1a1a]" : "bg-[#FAFAFA]";
    const gridCellBg = darkMode ? "bg-[#262626]" : "bg-[#EFEFEF]";
    const gridIconColor = darkMode ? "text-[#555]" : "text-[#C7C7C7]";
    const arrowStroke = darkMode ? "#E4E6EB" : "#262626";

    return (
      <div
        ref={ref}
        className={`mx-auto w-full ${compact ? "max-w-[320px]" : "max-w-[400px]"} overflow-hidden rounded-2xl ${bg} shadow-lg`}
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
      >
        {/* Top Bar — username: 20px weight 400 line-height 25px */}
        <div className={`flex h-[44px] items-center justify-between border-b ${borderLight} px-4`}>
          <div className="flex items-center gap-1">
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
              <path d="M8 2L2 9L8 16" stroke={arrowStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={`text-[16px] font-normal leading-[20px] ${textPrimary}`}>{displayName}</span>
          <div className="w-4" />
        </div>

        {/* Profile Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={`flex ${compact ? "h-[68px] w-[68px]" : "h-[86px] w-[86px]"} items-center justify-center rounded-full p-[3px]`}
                style={{
                  background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                }}
              >
                <div
                  className={`flex h-full w-full items-center justify-center rounded-full border-[3px] ${darkMode ? "border-black" : "border-white"}`}
                  style={{ backgroundColor: iconColor || "#F5A623" }}
                >
                  {showFace === false ? (
                    <span className={`${compact ? "text-xl" : "text-2xl"} font-bold text-white select-none`}>{initial}</span>
                  ) : (
                    <User className={`${compact ? "h-6 w-6" : "h-8 w-8"} text-white/80`} />
                  )}
                </div>
              </div>
            </div>

            {/* Stats — numbers: 16px/600/20px, labels: 14px/400/18px */}
            <div className="flex flex-1 justify-around text-center">
              <div>
                <div className={`${compact ? "text-[14px] leading-[18px]" : "text-[16px] leading-[20px]"} font-semibold ${textPrimary}`}>24</div>
                <div className={`text-[14px] leading-[18px] font-normal ${textSecondary}`}>投稿</div>
              </div>
              <div>
                <div className={`${compact ? "text-[14px] leading-[18px]" : "text-[16px] leading-[20px]"} font-semibold ${textPrimary}`}>158</div>
                <div className={`text-[14px] leading-[18px] font-normal ${textSecondary}`}>フォロワー</div>
              </div>
              <div>
                <div className={`${compact ? "text-[14px] leading-[18px]" : "text-[16px] leading-[20px]"} font-semibold ${textPrimary}`}>89</div>
                <div className={`text-[14px] leading-[18px] font-normal ${textSecondary}`}>フォロー中</div>
              </div>
            </div>
          </div>

          {/* Name — 14px/600/18px */}
          <div className="mt-3">
            <span className={`text-[14px] font-semibold leading-[18px] ${textPrimary}`}>{displayName}</span>
          </div>

          {/* Bio — 14px/400/18px (exact Instagram spec) */}
          {profileText ? (
            <div className="mt-1">
              <div className={`whitespace-pre-wrap text-[14px] font-normal leading-[18px] ${textPrimary}`}>
                {displayLines.join("\n")}
              </div>
              {shouldTruncate && (
                <button
                  type="button"
                  className={`text-[14px] leading-[18px] ${textSecondary}`}
                  onClick={() => setExpanded(true)}
                >
                  ...more
                </button>
              )}
              {expanded && lines.length > 3 && (
                <button
                  type="button"
                  className={`ml-1 text-[14px] leading-[18px] ${textSecondary}`}
                  onClick={() => setExpanded(false)}
                >
                  less
                </button>
              )}
            </div>
          ) : (
            <div className={`mt-1 text-[14px] leading-[18px] ${textSecondary}`}>（プロフィール文が未設定です）</div>
          )}

          {/* Action Buttons — 14px/600, h-36px, border-radius 10px */}
          <div className="mt-3 flex gap-1.5">
            <button
              type="button"
              className={`flex-1 rounded-[10px] ${btnBg} h-[36px] text-center text-[14px] font-semibold ${textPrimary}`}
            >
              プロフィールを編集
            </button>
            <button
              type="button"
              className={`flex-1 rounded-[10px] ${btnBg} h-[36px] text-center text-[14px] font-semibold ${textPrimary}`}
            >
              プロフィールをシェア
            </button>
          </div>

          {/* Story Highlights — label: 12px/16px */}
          {!compact && (
            <div className="mt-4 flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-[64px] w-[64px] items-center justify-center rounded-full border ${highlightBorder} ${highlightBg}`}>
                  <Camera className={`h-6 w-6 ${gridIconColor}`} />
                </div>
                <span className={`text-[12px] leading-[16px] ${textSecondary}`}>新規</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className={`mt-2 flex border-t ${border}`}>
          <button type="button" className={`flex flex-1 justify-center border-b-2 ${darkMode ? "border-[#E4E6EB]" : "border-[#262626]"} py-2.5`}>
            <Grid3X3 className={`h-5 w-5 ${textPrimary}`} />
          </button>
          <button type="button" className="flex flex-1 justify-center py-2.5">
            <Bookmark className={`h-5 w-5 ${textSecondary}`} />
          </button>
        </div>

        {/* Post Grid */}
        <div className={`grid grid-cols-3 gap-[1px] ${gridBg}`}>
          {Array.from({ length: compact ? 3 : 6 }).map((_, i) => (
            <div key={i} className={`relative aspect-square ${gridCellBg}`}>
              {i === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className={`h-8 w-8 ${gridIconColor}`} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Nav Bar */}
        <div className={`flex items-center justify-around border-t ${border} py-2`}>
          <svg className={`h-6 w-6 ${textPrimary}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.005 16.545a2.997 2.997 0 012.997-2.997A2.997 2.997 0 0115 16.545V22H9.005v-5.455z"/>
            <path d="M3 10.5L12 2l9 8.5V22h-6v-5.455a2.997 2.997 0 00-2.997-2.997A2.997 2.997 0 009.005 16.545V22H3V10.5z" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <svg className={`h-6 w-6 ${textSecondary}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <svg className={`h-7 w-7 ${textSecondary}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
          <Heart className={`h-6 w-6 ${textSecondary}`} />
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: iconColor || "#F5A623" }}
          >
            {initial}
          </div>
        </div>
      </div>
    );
  }
);

InstagramMockup.displayName = "InstagramMockup";

export default InstagramMockup;
