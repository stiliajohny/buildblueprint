"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { browserClient, configured } from "@/lib/supabase/client";

/** Header link that follows the current Supabase session. */
export function AccountLink() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!configured()) return;
    const { data } = browserClient().auth.onAuthStateChange(
      (_event, session) => {
        setSignedIn(Boolean(session));
      },
    );
    return () => data.subscription.unsubscribe();
  }, []);
  if (signedIn)
    return (
      <Link href="/projects" className="sign-in">
        Account
      </Link>
    );
  return (
    <Link href="/auth" className="sign-in">
      Sign in
    </Link>
  );
}
