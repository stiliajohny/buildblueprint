"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { browserClient, configured } from "@/lib/supabase/client";

/** Lets a signed-in recovery session choose a new password. */
export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState<"loading" | "ready" | "missing">(
    "loading",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!configured()) {
      setReady("missing");
      return;
    }
    let active = true;
    const { data } = browserClient().auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        if (session) setReady("ready");
        else if (event === "INITIAL_SESSION") setReady("missing");
      },
    );
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await browserClient().auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      location.assign("/projects");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not update the password.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Choose a new password</h1>
      <p className="muted">
        Use at least 8 characters. This replaces the password on your account.
      </p>
      {ready === "loading" && (
        <p className="muted">Checking your reset link…</p>
      )}
      {ready === "missing" && (
        <div className="auth-note error" role="alert">
          This reset link is missing or has expired.{" "}
          <Link href="/auth?mode=forgot">Request a new one</Link>.
        </div>
      )}
      {ready === "ready" && (
        <form onSubmit={(event) => void onSubmit(event)}>
          {error && (
            <p className="auth-note error" role="alert">
              {error}
            </p>
          )}
          <div className="auth-field">
            <label htmlFor="new-password">New password</label>
            <div className="password-field">
              <input
                id="new-password"
                name="new-password"
                type={visible ? "text" : "password"}
                minLength={8}
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
          </div>
          <div className="auth-field">
            <label htmlFor="confirm-new-password">Confirm password</label>
            <input
              id="confirm-new-password"
              name="confirm-new-password"
              type={visible ? "text" : "password"}
              minLength={8}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
          <Button variant="primary" disabled={busy} type="submit">
            {busy ? "Please wait…" : "Update password"}
          </Button>
        </form>
      )}
      <Link className="auth-quiet" href="/auth">
        Back to sign in
      </Link>
    </div>
  );
}
