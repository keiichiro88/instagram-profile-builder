import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "./rate-limit";

/** Max string length for text input fields */
export const MAX_TEXT_LENGTH = 1000;
/** Max total JSON body size (5 MB — covers base64 screenshots) */
export const MAX_BODY_SIZE = 5 * 1024 * 1024;
/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Rate-limit guard. Returns a 429 response if exceeded, or null if OK.
 * Default: 20 requests per minute per IP.
 */
export function rateLimitGuard(
  req: NextRequest,
  limit = 20,
  windowMs = 60_000,
): NextResponse | null {
  const ip = getClientIp(req.headers);
  if (!checkRateLimit(ip, limit, windowMs)) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってからお試しください。" },
      { status: 429 },
    );
  }
  return null;
}

/**
 * Validate that a string field is present and within length limits.
 */
export function validateString(
  value: unknown,
  fieldName: string,
  maxLength = MAX_TEXT_LENGTH,
): string | NextResponse {
  if (typeof value !== "string" || value.trim().length === 0) {
    return NextResponse.json(
      { error: `${fieldName} is required` },
      { status: 400 },
    );
  }
  if (value.length > maxLength) {
    return NextResponse.json(
      { error: `${fieldName} is too long (max ${maxLength} chars)` },
      { status: 400 },
    );
  }
  return value.trim();
}

/**
 * Validate a base64 image data URL. Returns { mimeType, base64 } or error response.
 */
export function validateImageDataUrl(
  image: unknown,
): { mimeType: string; base64: string } | NextResponse {
  if (typeof image !== "string") {
    return NextResponse.json(
      { error: "Image data is required" },
      { status: 400 },
    );
  }

  // 5MB base64 ≈ 3.75MB raw image
  if (image.length > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: "画像サイズが大きすぎます（最大4MB）" },
      { status: 413 },
    );
  }

  const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: "Invalid image format. Please upload a PNG or JPEG." },
      { status: 400 },
    );
  }

  const mimeType = match[1];
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: "PNG、JPEG、WebP のみ対応しています。" },
      { status: 400 },
    );
  }

  return { mimeType, base64: match[2] };
}
