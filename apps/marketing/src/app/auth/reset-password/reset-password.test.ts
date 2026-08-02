import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(path.join(import.meta.dirname, "page.tsx"), "utf8");
const formSource = readFileSync(path.join(import.meta.dirname, "ResetPasswordForm.tsx"), "utf8");

describe("auth reset password page", () => {
  it("renders the reset password form shell", () => {
    expect(pageSource).toContain("ResetPasswordForm");
    expect(pageSource).toContain("Reset password");
  });

  it("requires the mobile password policy and app deep link", () => {
    expect(formSource).toContain("NEW_PASSWORD_REQUIREMENT");
    expect(formSource).toContain("fieldsoli://sign-in");
    expect(formSource).toContain("updateUser");
  });
});
