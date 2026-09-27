const modes = ["signin", "signup", "forgot", "magic", "otp", "phone"] as const;

export type AuthMode = (typeof modes)[number];

/** Reads the auth screen from a query value, defaulting to sign-in. */
export function authMode(value: string | undefined): AuthMode {
  return modes.includes(value as AuthMode) ? (value as AuthMode) : "signin";
}

/** Maps a failed auth callback into a short message for the sign-in screen. */
export function authErrorMessage(value: string | undefined): string {
  if (!value) return "";
  if (value === "callback")
    return "That link is invalid or has expired. Request a new one.";
  return value.slice(0, 180);
}

/**
 * Keeps post-login redirects on this app.
 * Rejects protocol-relative and off-site targets.
 */
export function safeNextPath(
  value: string | null,
  fallback = "/projects",
): string {
  if (!value) return fallback;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    decoded.includes("://") ||
    decoded.includes("\0")
  )
    return fallback;
  const path = decoded.split(/[?#]/)[0] ?? "";
  const allowed =
    path === "/builder" ||
    path === "/projects" ||
    path.startsWith("/projects/") ||
    path === "/auth/update-password";
  return allowed ? decoded : fallback;
}
