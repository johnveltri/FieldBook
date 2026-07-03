import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PRIVACY_POLICY_VERSION } from "@/lib/waitlist-validation";

const pageSource = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");
const markdownSource = readFileSync(
  path.resolve(import.meta.dirname, "../../../../../docs/legal/privacy-policy.md"),
  "utf8",
);

describe("website privacy policy", () => {
  it("matches the canonical policy version", () => {
    const markdownVersion = markdownSource.match(/\*\*Policy version:\*\* ([\d-]+)/)?.[1];
    const pageVersion = pageSource.match(/const policyVersion = "([\d-]+)"/)?.[1];

    expect(pageVersion).toBe(markdownVersion);
    expect(PRIVACY_POLICY_VERSION).toBe(markdownVersion);
  });

  it("renders every section from the canonical Markdown policy", () => {
    const headings = [...markdownSource.matchAll(/^#{2,3} (.+)$/gm)].map((match) => match[1]);

    for (const heading of headings) {
      expect(pageSource).toContain(`>${heading}<`);
    }
  });

  it("includes waitlist collection, use, consent withdrawal, and deletion disclosures", () => {
    expect(pageSource).toContain("Waitlist, account, and profile information");
    expect(pageSource).toContain("operate the waitlist and send requested early-access and product updates");
    expect(pageSource).toContain("withdrawal of waitlist marketing consent");
    expect(pageSource).toContain("remove a waitlist record");
  });
});
