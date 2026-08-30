import type { Metadata } from "next";

import { DownloadClient } from "./DownloadClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Download your FieldSoli export",
  description: "Download a private FieldSoli job export.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function ExportDownloadPage() {
  return <DownloadClient />;
}
