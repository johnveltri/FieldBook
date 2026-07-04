import type { Metadata } from "next";
import Link from "next/link";

import styles from "./delete-account.module.css";

export const metadata: Metadata = {
  title: "Delete Account",
  description: "How to delete your FieldSolo account and associated data.",
};

export default function DeleteAccountPage() {
  return (
    <main className={styles.page}>
      <article className={styles.article}>
        <Link className={styles.back} href="/">← Back to FieldSolo</Link>
        <p className={styles.eyebrow}>Account deletion</p>
        <h1>Delete your FieldSolo account</h1>
        <p className={styles.lead}>
          You can permanently delete your FieldSolo account and the job records, sessions, notes,
          and materials associated with it. This action cannot be undone.
        </p>

        <h2>Delete in the app</h2>
        <p>If you can access the FieldSolo mobile app, use the in-app deletion control:</p>
        <ol>
          <li>Sign in to your FieldSolo account.</li>
          <li>Open <strong>Profile</strong>.</li>
          <li>Scroll to <strong>Delete account</strong>.</li>
          <li>Confirm deletion when prompted.</li>
        </ol>
        <p>
          Deleting your account removes your profile and all associated jobs, work sessions, notes,
          and materials from active FieldSolo systems.
        </p>

        <h2>What gets deleted</h2>
        <p>When you delete your account, we delete:</p>
        <ul>
          <li>Your account credentials and profile information (name, email, trade selections)</li>
          <li>All job records you created</li>
          <li>Work sessions, notes, and materials linked to your account</li>
        </ul>

        <h2>Retention after deletion</h2>
        <p>
          We delete active account and User Content from production systems within{" "}
          <strong>30 days</strong> of your deletion request. Encrypted backup copies are scheduled
          to expire within <strong>90 days</strong>.
        </p>
        <p>
          We may retain a limited amount of information longer when necessary for legal compliance,
          security, fraud prevention, dispute resolution, or enforcement. Any retained information
          is limited to what is required for that purpose.
        </p>

        <h2>Cannot access the app?</h2>
        <p>
          If you cannot sign in or no longer have the app installed, email us at{" "}
          <a href="mailto:privacy@fieldsolo.com">privacy@fieldsolo.com</a> from the email address
          associated with your account. Include &ldquo;Account deletion request&rdquo; in the
          subject line. We may verify your identity before processing the request.
        </p>

        <p className={styles.note}>
          For other privacy requests — access, correction, portability, or analytics withdrawal —
          see our <Link href="/privacy">Privacy Policy</Link> or contact{" "}
          <a href="mailto:privacy@fieldsolo.com">privacy@fieldsolo.com</a>.
        </p>
      </article>
    </main>
  );
}
