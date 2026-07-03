import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { TERMS_VERSION } from "@/lib/waitlist-validation";

const pageSource = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");
const markdownSource = readFileSync(
  path.resolve(import.meta.dirname, "../../../../../docs/legal/terms.md"),
  "utf8",
);

describe("website terms and conditions", () => {
  it("matches the canonical terms version", () => {
    const markdownVersion = markdownSource.match(/\*\*Terms version:\*\* ([\d-]+)/)?.[1];
    const pageVersion = pageSource.match(/const termsVersion = "([\d-]+)"/)?.[1];

    expect(pageVersion).toBe(markdownVersion);
    expect(TERMS_VERSION).toBe(markdownVersion);
  });

  it("renders every section from the canonical Markdown terms", () => {
    const headings = [...markdownSource.matchAll(/^#{2,3} (.+)$/gm)].map((match) => match[1]);

    for (const heading of headings) {
      expect(pageSource).toContain(`>${heading}<`);
    }
  });

  it("includes account deletion and privacy policy references", () => {
    expect(pageSource).toContain("Delete account");
    expect(pageSource).toContain('href="/privacy"');
    expect(pageSource).toContain('href="/delete-account"');
  });
});
