import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { TERMS_VERSION } from "@/lib/waitlist-validation";

const pageSource = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");
const rendererSource = readFileSync(
  path.resolve(import.meta.dirname, "../../components/LegalDocument.tsx"),
  "utf8",
);
const markdownSource = readFileSync(
  path.resolve(import.meta.dirname, "../../../../../docs/legal/terms.md"),
  "utf8",
);

describe("website terms of service", () => {
  it("matches the canonical terms version", () => {
    const markdownVersion = markdownSource.match(/\*\*Terms version:\*\* ([\d-]+)/)?.[1];

    expect(TERMS_VERSION).toBe(markdownVersion);
  });

  it("renders the canonical Markdown terms directly", () => {
    expect(pageSource).toContain('<LegalDocument fileName="terms.md" />');
    expect(rendererSource).toContain("<ReactMarkdown>{content}</ReactMarkdown>");
  });

  it("includes account deletion and privacy policy references", () => {
    expect(markdownSource).toContain("Delete account");
    expect(markdownSource).toContain("https://fieldsolo.com/privacy");
    expect(markdownSource).toContain("https://fieldsolo.com/delete-account");
  });
});
