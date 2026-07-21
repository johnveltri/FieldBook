import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PRIVACY_POLICY_VERSION } from "@/lib/waitlist-validation";

const pageSource = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");
const rendererSource = readFileSync(
  path.resolve(import.meta.dirname, "../../components/LegalDocument.tsx"),
  "utf8",
);
const markdownSource = readFileSync(
  path.resolve(import.meta.dirname, "../../../../../docs/legal/privacy-policy.md"),
  "utf8",
);

describe("website privacy policy", () => {
  it("matches the canonical policy version", () => {
    const markdownVersion = markdownSource.match(/\*\*Policy version:\*\* ([\d-]+)/)?.[1];

    expect(PRIVACY_POLICY_VERSION).toBe(markdownVersion);
  });

  it("renders the canonical Markdown policy directly", () => {
    expect(pageSource).toContain('<LegalDocument fileName="privacy-policy.md" />');
    expect(rendererSource).toContain("<ReactMarkdown>{content}</ReactMarkdown>");
  });

  it("includes waitlist collection, use, consent withdrawal, and deletion disclosures", () => {
    expect(markdownSource).toContain("Waitlist and marketing information");
    expect(markdownSource).toContain("send early-access or product communications");
    expect(markdownSource).toContain("withdrawal of marketing consent");
    expect(markdownSource).toContain("remove your waitlist record");
  });
});
