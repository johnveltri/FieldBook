import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fieldsolo.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FieldSolo | Job & Profit Tracker for Tradespeople",
    template: "%s | FieldSolo",
  },
  description:
    "FieldSolo helps skilled trade professionals keep jobs, notes, materials, and profit tracking all in one place. ",
  applicationName: "FieldSolo",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
    },
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f4eddf",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
