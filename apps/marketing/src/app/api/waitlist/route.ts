import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  parseWaitlistPayload,
  PRIVACY_POLICY_VERSION,
} from "@/lib/waitlist-validation";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16_384;
const RATE_LIMIT_PER_HOUR = 10;

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ ok: false, message }, { status, headers });
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function rateLimitKey(request: Request) {
  const secret = process.env.WAITLIST_RATE_LIMIT_SALT
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing WAITLIST_RATE_LIMIT_SALT or SUPABASE_SERVICE_ROLE_KEY");

  return createHmac("sha256", secret).update(clientIp(request)).digest("hex");
}

function formBody(rawBody: string) {
  const params = new URLSearchParams(rawBody);
  const list = (name: string) => (params.get(name) ?? "").split(",").filter(Boolean);
  const usesSoftware = params.get("usesSoftware");

  return {
    firstName: params.get("firstName"),
    email: params.get("email"),
    trades: list("trades"),
    usesSoftware: usesSoftware === "yes" ? true : usesSoftware === "no" ? false : null,
    trackingTools: list("trackingTools"),
    jobSources: list("jobSources"),
    privacyAccepted: params.get("privacyAccepted") === "true",
    website: params.get("website"),
  };
}

function parseBody(rawBody: string, contentType: string | null): unknown {
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    return formBody(rawBody);
  }
  return JSON.parse(rawBody);
}

export async function POST(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin) {
    return jsonError("Request origin is not allowed.", 403);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError("Request body is too large.", 413);
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return jsonError("Request body is too large.", 413);
    }
    body = parseBody(rawBody, request.headers.get("content-type"));
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  if (
    body
    && typeof body === "object"
    && typeof (body as Record<string, unknown>).website === "string"
    && (body as Record<string, string>).website.trim()
  ) {
    return NextResponse.json(
      { ok: true, message: "You're on the list!" },
      { status: 201 },
    );
  }

  const payload = parseWaitlistPayload(body);
  if (!payload) {
    return jsonError("Please check your entries and try again.", 400);
  }

  const supabase = getSupabaseAdmin();
  const { data: allowed, error: rateLimitError } = await supabase.rpc(
    "consume_waitlist_rate_limit",
    { p_key_hash: rateLimitKey(request), p_limit: RATE_LIMIT_PER_HOUR },
  );

  if (rateLimitError) {
    console.error("waitlist rate limit failed:", rateLimitError);
    return jsonError("Something went wrong. Please try again.", 503);
  }

  if (!allowed) {
    return jsonError(
      "Too many attempts. Please try again later.",
      429,
      { "Retry-After": "3600" },
    );
  }

  const signupRecord = {
    first_name: payload.firstName,
    email: payload.email,
    trades: payload.trades,
    uses_software: payload.usesSoftware,
    tracking_tools: payload.trackingTools,
    job_sources: payload.jobSources,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
    privacy_accepted_at: new Date().toISOString(),
    marketing_consent: true,
  };

  const { error } = await supabase.from("waitlist_signups").insert(signupRecord);

  if (error) {
    if (error.code === "23505") {
      const { error: updateError } = await supabase
        .from("waitlist_signups")
        .update({
          first_name: signupRecord.first_name,
          trades: signupRecord.trades,
          uses_software: signupRecord.uses_software,
          tracking_tools: signupRecord.tracking_tools,
          job_sources: signupRecord.job_sources,
          privacy_policy_version: signupRecord.privacy_policy_version,
          privacy_accepted_at: signupRecord.privacy_accepted_at,
          marketing_consent: signupRecord.marketing_consent,
        })
        .eq("email", payload.email);

      if (updateError) {
        console.error("waitlist consent update failed:", updateError);
        return jsonError("Something went wrong. Please try again.", 500);
      }

      return NextResponse.json({
        ok: true,
        message: "You're already on the list. We'll be in touch soon.",
      });
    }

    console.error("waitlist insert failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }

  return NextResponse.json(
    { ok: true, message: "You're on the list!" },
    { status: 201 },
  );
}
