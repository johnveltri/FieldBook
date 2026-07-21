import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import Link from "next/link";
import ReactMarkdown from "react-markdown";

import styles from "@/app/legal.module.css";

type LegalDocumentProps = {
  fileName: "privacy-policy.md" | "terms.md";
};

function readLegalDocument(fileName: LegalDocumentProps["fileName"]) {
  const candidates = [
    path.resolve(process.cwd(), "docs/legal", fileName),
    path.resolve(process.cwd(), "../../docs/legal", fileName),
  ];
  const documentPath = candidates.find((candidate) => existsSync(candidate));

  if (!documentPath) {
    throw new Error(`Unable to find canonical legal document: ${fileName}`);
  }

  return readFileSync(documentPath, "utf8");
}

export function LegalDocument({ fileName }: LegalDocumentProps) {
  const content = readLegalDocument(fileName);

  return (
    <main className={styles.page}>
      <article className={styles.policy}>
        <Link className={styles.back} href="/">
          ← Back to FieldSolo
        </Link>
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </main>
  );
}
