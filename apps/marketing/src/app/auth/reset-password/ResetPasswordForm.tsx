"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import landingStyles from "../../../components/LandingPage.module.css";
import styles from "../../legal.module.css";
import pageStyles from "../confirmed/confirmed.module.css";

import {
  NEW_PASSWORD_REQUIREMENT,
  newPasswordMeetsPolicy,
  newPasswordPolicyError,
} from "@/lib/password-policy";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const APP_SIGN_IN_DEEP_LINK = "fieldsoli://sign-in";

type Phase = "loading" | "ready" | "missing_config" | "invalid_link" | "done";

export function ResetPasswordForm() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setPhase("missing_config");
      return;
    }

    let cancelled = false;

    void (async () => {
      const hashParams = new URLSearchParams(
        typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "",
      );
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          if (!cancelled) setPhase("invalid_link");
          return;
        }
      }

      const { data, error: sessionReadError } = await client.auth.getSession();
      if (cancelled) return;
      if (sessionReadError || !data.session) {
        setPhase("invalid_link");
        return;
      }
      setPhase("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const policyError = newPasswordPolicyError(password);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Password reset is unavailable right now.");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      await client.auth.signOut();
      setPhase("done");
    } finally {
      setBusy(false);
    }
  };

  if (phase === "loading") {
    return (
      <main className={styles.page}>
        <article className={`${styles.policy} ${pageStyles.panel}`}>
          <p>Loading…</p>
        </article>
      </main>
    );
  }

  if (phase === "missing_config") {
    return (
      <main className={styles.page}>
        <article className={`${styles.policy} ${pageStyles.panel}`}>
          <h1>Password reset unavailable</h1>
          <p>
            This page is not configured yet. Email{" "}
            <a href="mailto:support@fieldsoli.com">support@fieldsoli.com</a> for help.
          </p>
        </article>
      </main>
    );
  }

  if (phase === "invalid_link") {
    return (
      <main className={styles.page}>
        <article className={`${styles.policy} ${pageStyles.panel}`}>
          <h1>Reset link expired</h1>
          <p>
            Open FieldSoli on your phone, tap Forgot password?, and request a new reset link.
          </p>
          <p className={pageStyles.secondary}>
            <Link href="/">Return to fieldsoli.com</Link>
          </p>
        </article>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className={styles.page}>
        <article className={`${styles.policy} ${pageStyles.panel}`}>
          <h1>Password updated</h1>
          <p>Your new password is saved. Open FieldSoli and sign in.</p>
          <a className={`${landingStyles.primaryButton} ${pageStyles.cta}`} href={APP_SIGN_IN_DEEP_LINK}>
            Open FieldSoli &amp; log in
          </a>
          <p className={pageStyles.secondary}>
            <Link href="/">Return to fieldsoli.com</Link>
          </p>
        </article>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <article className={`${styles.policy} ${pageStyles.panel}`}>
        <h1>Choose a new password</h1>
        <p>{NEW_PASSWORD_REQUIREMENT}</p>
        <form onSubmit={(event) => void onSubmit(event)} className={pageStyles.form}>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError(null);
              }}
              required
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (error) setError(null);
              }}
              required
            />
          </label>
          {!newPasswordMeetsPolicy(password) && password.length > 0 ? (
            <p>{NEW_PASSWORD_REQUIREMENT}</p>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
          <button
            className={`${landingStyles.primaryButton} ${pageStyles.cta}`}
            type="submit"
            disabled={busy || !newPasswordMeetsPolicy(password) || password !== confirmPassword}
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
        <p className={pageStyles.secondary}>
          <Link href="/">Return to fieldsoli.com</Link>
        </p>
      </article>
    </main>
  );
}
