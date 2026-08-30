"use client";

import { useEffect, useState } from "react";

import styles from "./download.module.css";

type DownloadState = "loading" | "unavailable";

const unavailableMessage = "This download link is unavailable or has expired.";

function getRedemptionEndpoint() {
  const configuredEndpoint = process.env.NEXT_PUBLIC_SUPABASE_REDEEM_JOB_EXPORT_URL?.trim();
  if (configuredEndpoint) return configuredEndpoint;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return null;

  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/redeem-job-export`;
}

function readAndClearToken() {
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token");

  // Clear the bearer token before any network request. Also remove query
  // parameters so a malformed link cannot leave token material in history.
  window.history.replaceState(null, "", window.location.pathname);

  return token?.trim() || null;
}

async function redeemToken(token: string) {
  const endpoint = getRedemptionEndpoint();
  if (!endpoint) throw new Error("redemption_endpoint_unconfigured");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
    credentials: "omit",
  });

  if (!response.ok) throw new Error("export_unavailable");

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") throw new Error("export_unavailable");

  const signedUrl =
    "signed_url" in payload && typeof payload.signed_url === "string"
      ? payload.signed_url
      : "signedUrl" in payload && typeof payload.signedUrl === "string"
        ? payload.signedUrl
        : null;

  if (!signedUrl || !signedUrl.startsWith("https://")) {
    throw new Error("export_unavailable");
  }

  window.location.replace(signedUrl);
}

export function DownloadClient() {
  const [state, setState] = useState<DownloadState>("loading");

  useEffect(() => {
    // This effect intentionally performs fragment removal synchronously before
    // redeemToken can issue its fetch request.
    let cancelled = false;
    const token = readAndClearToken();

    if (!token) {
      void Promise.resolve().then(() => {
        if (!cancelled) setState("unavailable");
      });
      return () => {
        cancelled = true;
      };
    }

    void redeemToken(token).catch(() => {
      if (!cancelled) setState("unavailable");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className={styles.page} aria-live="polite">
      <div className={styles.card}>
        <p className={styles.eyebrow}>FieldSoli export</p>
        {state === "loading" ? (
          <>
            <h1 className={styles.heading}>Preparing your download</h1>
            <p className={styles.copy}>Please wait while we securely retrieve your CSV.</p>
          </>
        ) : (
          <>
            <h1 className={styles.heading}>Download unavailable</h1>
            <p className={styles.copy}>{unavailableMessage}</p>
            <p className={styles.support}>
              Need help? Email <a href="mailto:support@fieldsoli.com">support@fieldsoli.com</a>.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
