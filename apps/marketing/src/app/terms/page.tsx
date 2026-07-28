import type { Metadata } from "next";

import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing access to and use of FieldSoli.",
};

export default function TermsPage() {
  return <LegalDocument fileName="terms.md" />;
}
