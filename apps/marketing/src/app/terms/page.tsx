import type { Metadata } from "next";

import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing access to and use of FieldSolo.",
};

export default function TermsPage() {
  return <LegalDocument fileName="terms.md" />;
}
