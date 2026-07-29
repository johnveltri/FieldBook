import type { Metadata } from "next";
import Link from "next/link";

import styles from "../../legal.module.css";
import pageStyles from "./confirmed.module.css";

export const metadata: Metadata = {
  title: "Email confirmed",
  description: "Your FieldSoli email is confirmed. Open the app to sign in.",
};

const APP_SIGN_IN_DEEP_LINK = "fieldsoli://sign-in";

export default function AuthConfirmedPage() {
  return (
    <main className={styles.page}>
      <article className={`${styles.policy} ${pageStyles.panel}`}>
        <Link className={styles.back} href="/">
          ← Back to FieldSoli
        </Link>

        <h1>Your email is confirmed</h1>
        <p>
          Thanks for confirming your FieldSoli account. Open the app on your phone and sign in with
          the email and password you chose when you created your account.
        </p>

        <a className={pageStyles.primaryCta} href={APP_SIGN_IN_DEEP_LINK}>
          Open FieldSoli &amp; log in
        </a>

        <p className={pageStyles.secondary}>
          Don&apos;t have the app installed yet?{" "}
          <Link href="/">Return to fieldsoli.com</Link> or email{" "}
          <a href="mailto:support@fieldsoli.com">support@fieldsoli.com</a> if you need help.
        </p>
      </article>
    </main>
  );
}
