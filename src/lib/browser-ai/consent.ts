export const BROWSER_LLM_COOKIE = "bb-browser-llm";
export type BrowserLlmChoice = "declined" | "accepted";

/** Reads the landing choice from a cookie value or a Cookie header. */
export function parseBrowserLlmChoice(
  raw: string | null | undefined,
): BrowserLlmChoice | null {
  if (!raw) return null;
  const direct = normalizeChoice(raw);
  if (direct) return direct;
  for (const part of raw.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === BROWSER_LLM_COOKIE) return normalizeChoice(rest.join("="));
  }
  return null;
}

/** Builds a 180-day preference cookie. It does not start a download. */
export function browserLlmCookie(choice: BrowserLlmChoice, secure = false) {
  return `${BROWSER_LLM_COOKIE}=${choice}; Path=/; Max-Age=15552000; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Stores the landing choice in the browser and notifies open pages. */
export function writeBrowserLlmChoice(choice: BrowserLlmChoice) {
  const secure = typeof window !== "undefined" && window.isSecureContext;
  document.cookie = browserLlmCookie(choice, secure);
  window.dispatchEvent(new Event("bb-browser-llm"));
}

function normalizeChoice(value: string): BrowserLlmChoice | null {
  let decoded = value.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  return decoded === "declined" || decoded === "accepted" ? decoded : null;
}
