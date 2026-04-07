/**
 * API呼び出しヘルパー（リトライ + タイムアウト付き）
 */
export async function fetchWithRetry(
  url: string,
  body: Record<string, unknown>,
  retries = 3,
  timeoutMs = 120000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return res;
    if (res.status === 429 && i < retries - 1) {
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
      continue;
    }
    throw new Error(
      (await res.json().catch(() => ({}))).error || "API request failed"
    );
  }
  throw new Error("Max retries exceeded");
}
