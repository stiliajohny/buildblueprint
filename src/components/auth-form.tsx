"use client";
import { useState } from "react";
import { browserClient, configured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
export function AuthForm() {
  const [method, setMethod] = useState("password");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [signup, setSignup] = useState(false);
  async function run(
    action: () => Promise<{ error: { message: string } | null }>,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const { error } = await action();
      if (error) throw error;
      setMessage(
        method === "password" && !signup
          ? "Signed in. Open your projects."
          : "Check your inbox or phone for the next step.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : (e as { message?: string }).message || "Authentication failed",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card">
      <h1>Save your blueprints</h1>
      <p className="muted">
        Build and download without an account. Sign in to keep projects in sync.
      </p>
      {!configured() ? (
        <div className="issue">
          Account storage needs Supabase configuration. The anonymous builder
          and project downloads are available now.
        </div>
      ) : (
        <>
          <label>
            Sign-in method
            <select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setSent(false);
                setMessage("");
              }}
            >
              <option value="password">Email and password</option>
              <option value="magic">Magic link</option>
              <option value="otp">Email OTP</option>
              <option value="phone">Phone OTP</option>
            </select>
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const auth = browserClient().auth;
                if (method === "password")
                  return signup
                    ? auth.signUp({
                        email,
                        password,
                        options: {
                          emailRedirectTo: location.origin + "/auth/callback",
                        },
                      })
                    : auth.signInWithPassword({ email, password });
                if (sent && (method === "otp" || method === "phone")) {
                  const result =
                    method === "phone"
                      ? await auth.verifyOtp({ phone, token, type: "sms" })
                      : await auth.verifyOtp({ email, token, type: "email" });
                  if (!result.error) location.href = "/projects";
                  return result;
                }
                const result =
                  method === "phone"
                    ? await auth.signInWithOtp({ phone })
                    : await auth.signInWithOtp({
                        email,
                        options: {
                          emailRedirectTo: location.origin + "/auth/callback",
                        },
                      });
                if (!result.error) setSent(true);
                return result;
              });
            }}
          >
            {method === "phone" ? (
              <label>
                Phone number
                <input
                  type="tel"
                  required
                  placeholder="+44…"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            ) : (
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {method === "password" && (
              <label>
                Password
                <input
                  type="password"
                  minLength={8}
                  autoComplete={signup ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            {sent && (method === "otp" || method === "phone") && (
              <label>
                Verification code
                <input
                  autoComplete="one-time-code"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </label>
            )}
            <Button variant="primary" disabled={busy} type="submit">
              {busy
                ? "Please wait…"
                : method === "password"
                  ? signup
                    ? "Create account"
                    : "Sign in"
                  : sent && method !== "magic"
                    ? "Verify code"
                    : "Send link or code"}
            </Button>
          </form>
          {method === "password" && (
            <button className="btn ghost" onClick={() => setSignup((v) => !v)}>
              {signup
                ? "Already have an account? Sign in"
                : "Create a new account"}
            </button>
          )}
          <div className="auth-providers">
            {(["google", "apple", "facebook", "linkedin_oidc"] as const).map(
              (provider) => (
                <Button
                  key={provider}
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      browserClient().auth.signInWithOAuth({
                        provider,
                        options: {
                          redirectTo: location.origin + "/auth/callback",
                        },
                      }),
                    )
                  }
                >
                  {provider === "linkedin_oidc"
                    ? "LinkedIn"
                    : provider[0].toUpperCase() + provider.slice(1)}
                </Button>
              ),
            )}
          </div>
        </>
      )}
      {message && (
        <p role="status" className="muted">
          {message}
        </p>
      )}
      <a className="external" href="/builder">
        Continue to builder
      </a>
      <a className="external" href="/projects">
        Your saved projects
      </a>
    </div>
  );
}
