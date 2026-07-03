import { describe, expect, it } from "vitest";

import { parseWaitlistPayload } from "./waitlist-validation";

const validBody = {
  firstName: " Jane ",
  email: "Jane@Example.com",
  trades: ["plumbing", "hvac"],
  usesSoftware: true,
  trackingTools: ["spreadsheet_calendar"],
  jobSources: ["referrals", "repeat"],
  privacyAccepted: true,
};

describe("parseWaitlistPayload", () => {
  it("accepts a valid payload and normalizes name and email", () => {
    expect(parseWaitlistPayload(validBody)).toEqual({
      firstName: "Jane",
      email: "jane@example.com",
      trades: ["plumbing", "hvac"],
      usesSoftware: true,
      trackingTools: ["spreadsheet_calendar"],
      jobSources: ["referrals", "repeat"],
      privacyAccepted: true,
    });
  });

  it("rejects non-object bodies", () => {
    expect(parseWaitlistPayload(null)).toBeNull();
    expect(parseWaitlistPayload("bad")).toBeNull();
    expect(parseWaitlistPayload([])).toBeNull();
  });

  it("rejects empty first name", () => {
    expect(parseWaitlistPayload({ ...validBody, firstName: "   " })).toBeNull();
  });

  it("rejects invalid email", () => {
    expect(parseWaitlistPayload({ ...validBody, email: "not-an-email" })).toBeNull();
  });

  it("rejects non-boolean usesSoftware", () => {
    expect(parseWaitlistPayload({ ...validBody, usesSoftware: "yes" })).toBeNull();
  });

  it("requires privacy and marketing consent", () => {
    expect(parseWaitlistPayload({ ...validBody, privacyAccepted: false })).toBeNull();
    expect(parseWaitlistPayload({ ...validBody, privacyAccepted: undefined })).toBeNull();
  });

  it("rejects oversized names and email addresses", () => {
    expect(parseWaitlistPayload({ ...validBody, firstName: "a".repeat(101) })).toBeNull();
    expect(parseWaitlistPayload({
      ...validBody,
      email: `${"a".repeat(310)}@example.com`,
    })).toBeNull();
  });

  it("rejects empty option arrays", () => {
    expect(parseWaitlistPayload({ ...validBody, trades: [] })).toBeNull();
    expect(parseWaitlistPayload({ ...validBody, trackingTools: [] })).toBeNull();
    expect(parseWaitlistPayload({ ...validBody, jobSources: [] })).toBeNull();
  });

  it("rejects values outside the marketing option lists", () => {
    expect(parseWaitlistPayload({ ...validBody, trades: ["not-a-trade"] })).toBeNull();
    expect(parseWaitlistPayload({ ...validBody, trackingTools: ["fake-tool"] })).toBeNull();
    expect(parseWaitlistPayload({ ...validBody, jobSources: ["fake-source"] })).toBeNull();
  });

  it("rejects duplicate option values", () => {
    expect(parseWaitlistPayload({ ...validBody, trades: ["plumbing", "plumbing"] })).toBeNull();
  });
});
