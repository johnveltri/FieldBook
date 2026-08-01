import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");

describe("website support page", () => {
  it("provides an app-support contact route", () => {
    expect(pageSource).toContain("support@fieldsoli.com");
    expect(pageSource).toContain("FieldSoli support");
  });

  it("links people to privacy and account-deletion guidance", () => {
    expect(pageSource).toContain('<Link href="/delete-account">Delete account</Link>');
    expect(pageSource).toContain('<Link href="/privacy">Privacy Policy</Link>');
    expect(pageSource).toContain("privacy@fieldsoli.com");
  });
});
