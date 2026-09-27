import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNextPath } from "@/lib/auth/redirect";
import { serverClient } from "@/lib/supabase/server";

const otpTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

/** Sends the browser back to sign-in with a short failure reason. */
function fail(origin: string, reason: string) {
  const dest = new URL("/auth", origin);
  dest.searchParams.set("error", reason.slice(0, 180));
  return NextResponse.redirect(dest);
}

/** Exchanges a Supabase auth code or email token, then continues in the app. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const providerError = url.searchParams.get("error_description");
  const oauthError = url.searchParams.get("error");
  if (oauthError)
    return fail(
      url.origin,
      providerError || "Sign-in was cancelled. Try again.",
    );

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const flowId = url.searchParams.get("sb_flow_id");
  const recovery = type === "recovery";
  const next = safeNextPath(
    url.searchParams.get("next"),
    recovery ? "/auth/update-password" : "/projects",
  );
  const db = await serverClient();
  if (!db) return fail(url.origin, "Account storage is not configured.");

  if (tokenHash && type && otpTypes.has(type as EmailOtpType)) {
    const { error } = await db.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error)
      return NextResponse.redirect(
        new URL(recovery ? "/auth/update-password" : next, url.origin),
      );
  } else if (code) {
    const { error } = await db.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  return fail(url.origin, "That link is invalid or has expired.");
}
