"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authErrorMessage, type AuthMode } from "@/lib/auth/redirect";
import { browserClient, configured } from "@/lib/supabase/client";

/* Social sign-in is paused until the providers are configured.
const providers = [
  ["google", "Google"],
  ["apple", "Apple"],
  ["facebook", "Facebook"],
  ["linkedin_oidc", "LinkedIn"],
] as const;
*/

/** Collects email, password, or a one-time code and talks to Supabase Auth. */
export function AuthForm({
  mode,
  error: initialError,
}: {
  mode: AuthMode;
  error?: string;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(authErrorMessage(initialError));
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const copy = screenCopy(mode, sent);
  const finished = Boolean(status) && (mode === "signup" || mode === "forgot");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");
    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const auth = browserClient().auth;
      if (mode === "signin") {
        const { error: signInError } = await auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        location.assign("/projects");
        return;
      }
      if (mode === "signup") {
        const { data, error: signUpError } = await auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (signUpError) throw signUpError;
        if (data.user && data.user.identities?.length === 0) {
          setError(
            "An account with this email already exists. Sign in instead.",
          );
          return;
        }
        if (data.session) {
          location.assign("/projects");
          return;
        }
        setStatus(
          `Confirm ${email} to finish creating your account. We sent you a link.`,
        );
        return;
      }
      if (mode === "forgot") {
        const { error: resetError } = await auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
        });
        if (resetError) throw resetError;
        setStatus(
          `If an account exists for ${email}, we sent a link to choose a new password.`,
        );
        return;
      }
      if (sent && (mode === "otp" || mode === "phone")) {
        const result =
          mode === "phone"
            ? await auth.verifyOtp({ phone, token, type: "sms" })
            : await auth.verifyOtp({ email, token, type: "email" });
        if (result.error) throw result.error;
        location.assign("/projects");
        return;
      }
      const result =
        mode === "phone"
          ? await auth.signInWithOtp({ phone })
          : await auth.signInWithOtp({
              email,
              options:
                mode === "magic"
                  ? { emailRedirectTo: `${location.origin}/auth/callback` }
                  : { shouldCreateUser: true },
            });
      if (result.error) throw result.error;
      setSent(true);
      setStatus(
        mode === "phone"
          ? `We sent a code to ${phone}.`
          : mode === "otp"
            ? `We sent a code to ${email}.`
            : `We sent a sign-in link to ${email}.`,
      );
    } catch (caught) {
      setError(messageFrom(caught));
    } finally {
      setBusy(false);
    }
  }

  /* async function oauth(provider: (typeof providers)[number][0]) {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const { data, error: oauthError } =
        await browserClient().auth.signInWithOAuth({
          provider,
          options: { redirectTo: `${location.origin}/auth/callback` },
        });
      if (oauthError) throw oauthError;
      if (data.url) location.assign(data.url);
    } catch (caught) {
      setError(messageFrom(caught));
      setBusy(false);
    }
  } */

  return (
    <div className="auth-card">
      <h1>{copy.title}</h1>
      <p className="muted">{copy.detail}</p>
      {!configured() ? (
        <div className="issue" role="status">
          Account storage needs Supabase configuration. You can still build and
          download without an account.
        </div>
      ) : (
        <>
          {error && (
            <p className="auth-note error" role="alert">
              {error}
            </p>
          )}
          {status && (
            <p className="auth-note success" role="status">
              {status}
            </p>
          )}
          {!finished && (
            <form onSubmit={(event) => void onSubmit(event)}>
              {mode === "phone" ? (
                <Field id="phone" label="Phone number">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    placeholder="+1 555 0100"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </Field>
              ) : (
                <Field id="email" label="Email">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>
              )}
              {mode === "signin" && (
                <PasswordField
                  id="password"
                  label="Password"
                  value={password}
                  autoComplete="current-password"
                  onChange={setPassword}
                  aside={<Link href="/auth?mode=forgot">Forgot password?</Link>}
                />
              )}
              {mode === "signup" && (
                <>
                  <PasswordField
                    id="password"
                    label="Password"
                    value={password}
                    autoComplete="new-password"
                    onChange={setPassword}
                  />
                  <p className="auth-hint">At least 8 characters.</p>
                  <PasswordField
                    id="confirm-password"
                    label="Confirm password"
                    value={confirm}
                    autoComplete="new-password"
                    onChange={setConfirm}
                  />
                </>
              )}
              {sent && (mode === "otp" || mode === "phone") && (
                <Field id="token" label="Verification code">
                  <input
                    id="token"
                    name="token"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                  />
                </Field>
              )}
              <Button variant="primary" disabled={busy} type="submit">
                {busy ? "Please wait…" : copy.action}
              </Button>
            </form>
          )}
          <p className="auth-switch">
            {mode === "signup" ? (
              <>
                Already have an account? <Link href="/auth">Sign in</Link>
              </>
            ) : mode === "signin" ? (
              <>
                New here?{" "}
                <Link href="/auth?mode=signup">Create an account</Link>
              </>
            ) : (
              <Link href="/auth">Back to sign in</Link>
            )}
          </p>
          {/* Social sign-in is paused until the providers are configured.
          {mode !== "forgot" && (
            <>
              <div className="auth-divider">or</div>
              <div className="auth-providers">
                {providers.map(([provider, label]) => (
                  <Button
                    key={provider}
                    type="button"
                    disabled={busy}
                    onClick={() => void oauth(provider)}
                  >
                    Continue with {label}
                  </Button>
                ))}
              </div>
            </>
          )}
          */}
          {mode === "signin" && (
            <nav className="auth-alt" aria-label="Other sign-in methods">
              <Link href="/auth?mode=magic">Email link</Link>
              <Link href="/auth?mode=otp">Email code</Link>
              <Link href="/auth?mode=phone">Phone code</Link>
            </nav>
          )}
        </>
      )}
      <Link className="auth-quiet" href="/builder">
        Continue without an account
      </Link>
    </div>
  );
}

/** One labelled control in the auth card. */
function Field({
  id,
  label,
  aside,
  children,
}: {
  id: string;
  label: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="auth-field">
      <div className="auth-label-row">
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** Password input with a show/hide control. */
function PasswordField({
  id,
  label,
  value,
  autoComplete,
  onChange,
  aside,
}: {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  onChange: (value: string) => void;
  aside?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field id={id} label={label} aside={aside}>
      <div className="password-field">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          minLength={8}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}

/** Heading, explanation, and submit label for the active auth screen. */
function screenCopy(mode: AuthMode, sent: boolean) {
  if (mode === "signup")
    return {
      title: "Create account",
      detail: "Save blueprints to your account with email and a password.",
      action: "Create account",
    };
  if (mode === "forgot")
    return {
      title: "Reset your password",
      detail:
        "Enter your email and we will send a link to choose a new password.",
      action: "Send reset link",
    };
  if (mode === "magic")
    return {
      title: "Email sign-in link",
      detail: "We will email you a link that signs you in on this device.",
      action: sent ? "Resend link" : "Send sign-in link",
    };
  if (mode === "otp")
    return {
      title: "Email sign-in code",
      detail: "We will email you a one-time code.",
      action: sent ? "Verify code" : "Send code",
    };
  if (mode === "phone")
    return {
      title: "Phone sign-in code",
      detail: "We will text you a one-time code.",
      action: sent ? "Verify code" : "Send code",
    };
  return {
    title: "Sign in",
    detail: "Save projects to your account. You can still build without one.",
    action: "Sign in",
  };
}

/** Reads a thrown Supabase or network error. */
function messageFrom(caught: unknown) {
  if (caught instanceof Error && caught.message) return caught.message;
  if (typeof caught === "object" && caught && "message" in caught) {
    const message = (caught as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return "Authentication failed. Try again.";
}
