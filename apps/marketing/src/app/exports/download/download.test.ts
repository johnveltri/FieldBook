import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const routeDir = import.meta.dirname;
const clientSource = readFileSync(path.join(routeDir, "DownloadClient.tsx"), "utf8");
const pageSource = readFileSync(path.join(routeDir, "page.tsx"), "utf8");
const layoutSource = readFileSync(path.join(routeDir, "../../layout.tsx"), "utf8");
const analyticsSource = readFileSync(
  path.join(routeDir, "../../../components/SiteAnalytics.tsx"),
  "utf8",
);
const configSource = readFileSync(path.join(routeDir, "../../../../next.config.ts"), "utf8");

describe("secure export download surface", () => {
  it("removes the fragment before making the redemption request", () => {
    const clearIndex = clientSource.indexOf("window.history.replaceState");
    const fetchIndex = clientSource.indexOf("fetch(endpoint");

    expect(clearIndex).toBeGreaterThan(-1);
    expect(fetchIndex).toBeGreaterThan(clearIndex);
    expect(clientSource).toContain('JSON.stringify({ token })');
    expect(clientSource).toContain('method: "POST"');
  });

  it("uses a generic unavailable response for all redemption failures", () => {
    expect(clientSource).toContain("This download link is unavailable or has expired.");
    expect(clientSource).toContain('throw new Error("export_unavailable")');
    expect(clientSource).toContain('setState("unavailable")');
  });

  it("keeps analytics off the bearer-link route", () => {
    expect(layoutSource).toContain("<SiteAnalytics />");
    expect(layoutSource).not.toContain("<Analytics />");
    expect(analyticsSource).toContain('pathname === "/exports/download"');
    expect(analyticsSource).toContain("return null");
  });

  it("declares noindex metadata and route-specific security headers", () => {
    expect(pageSource).toContain('index: false');
    expect(pageSource).toContain('follow: false');
    expect(configSource).toContain('source: "/exports/download"');
    expect(configSource).toContain('Cache-Control", value: "private, no-store"');
    expect(configSource).toContain('Referrer-Policy", value: "no-referrer"');
    expect(configSource).toContain('X-Robots-Tag", value: "noindex, nofollow, noarchive"');
    expect(configSource).toContain("connect-src ${redeemOrigin}");
    expect(configSource).toContain("frame-ancestors 'none'");
    expect(configSource).toContain("script-src 'self' 'unsafe-inline'");
  });
});
