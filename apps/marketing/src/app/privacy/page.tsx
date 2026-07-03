import type { Metadata } from "next";
import Link from "next/link";

import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How FieldSolo collects, uses, retains, and protects personal information.",
};

const policyVersion = "2026-07-03";

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <article className={styles.policy}>
        <Link className={styles.back} href="/">← Back to FieldSolo</Link>
        <p className={styles.eyebrow}>Policy version {policyVersion}</p>
        <h1>Privacy Policy</h1>
        <p className={styles.effective}>Effective July 3, 2026</p>

        <p>FieldSolo is operated by <strong>Veltri Ventures LLC</strong> (“FieldSolo,” “we,” “us,” or “our”). This Privacy Policy explains how we collect, use, disclose, retain, and protect information when you use the FieldSolo mobile application, website, waitlist, and related services (collectively, the “Services”).</p>
        <p>This policy is intended for U.S. users. FieldSolo is for adults aged 18 and older and is not directed to children.</p>

        <h2>Information We Collect</h2>
        <p>We collect information you provide directly, information created while you use the Services, and limited information from service providers that help operate the Services.</p>

        <h3>Current FieldSolo data</h3>
        <ul>
          <li><strong>Waitlist, account, and profile information:</strong> first and last name, email address, trade selections, current software and job-tracking practices, job-source selections, account identifier, authentication information, marketing-consent status, and privacy-policy acceptance record.</li>
          <li><strong>Job record information:</strong> job descriptions, customer names, service addresses, job type, notes, materials, work-session dates and times, payment status, revenue, costs, collected amounts, and earnings calculations.</li>
          <li><strong>Service-use and diagnostic information:</strong> app interactions, app/session identifiers, device platform, app version, coarse operational error categories, and similar information needed to understand and improve reliability. If analytics is enabled, FieldSolo uses this information only after you agree to analytics collection.</li>
          <li><strong>Communications and privacy requests:</strong> information you send to us, including requests to access, correct, export, delete, or otherwise manage your data.</li>
        </ul>

        <h3>Optional and future features</h3>
        <p>FieldSolo may offer optional features that let you choose to provide photos, videos, audio or voice recordings, transcriptions, documents, invoices, receipts, screenshots, integrations, exports, team-sharing information, subscription information, and AI-assisted inputs and outputs. We will collect and use that information only when you choose to use the relevant feature and will update this policy and applicable store disclosures before a material new data practice takes effect.</p>
        <p>FieldSolo does not currently collect precise GPS location, calendar data, email inbox contents, bank-account details, or payment-card numbers.</p>

        <h2>How We Use Information</h2>
        <p>We use information to:</p>
        <ul>
          <li>provide, secure, personalize, maintain, and support the Services;</li>
          <li>operate the waitlist and send requested early-access and product updates;</li>
          <li>create and display your job records and earnings insights;</li>
          <li>authenticate users, prevent fraud and abuse, troubleshoot, and enforce our terms;</li>
          <li>communicate about your account, privacy requests, service changes, and support;</li>
          <li>measure product performance and improve features using limited analytics when you have agreed to it;</li>
          <li>process content for an AI-assisted action only when you explicitly choose that action; and</li>
          <li>create aggregated or de-identified statistics, benchmarks, and insights that do not reasonably identify you.</li>
        </ul>

        <h2>User Content and AI-Assisted Features</h2>
        <p>Users retain ownership of their User Content. By using FieldSolo, users grant FieldSolo a limited, worldwide, non-exclusive license to host, store, reproduce, process, analyze, transmit, display, and otherwise use User Content as necessary to provide, maintain, secure, improve, and develop the Services. FieldSolo may also create and use aggregated, anonymized, and de-identified data derived from User Content for analytics, benchmarking, industry insights, product improvement, research, and AI-powered features, provided such data does not reasonably identify any individual user, customer, or business.</p>
        <p>If you choose an AI-assisted feature, FieldSolo will clearly identify the action and the content being sent for that action. We process that content to provide the requested feature. We do not use raw User Content to train general-purpose AI models. Do not submit information you are not authorized to share.</p>

        <h2>How We Disclose Information</h2>
        <p>We do not sell personal information and do not share personal information for cross-context behavioral advertising. We may disclose information:</p>
        <ul>
          <li>to service providers that process information for us, including cloud hosting, database, authentication, storage, analytics, support, security, and, when you choose an AI feature, AI-processing providers;</li>
          <li>when you direct us to share information, such as through a future integration, export, or team-sharing feature;</li>
          <li>to comply with law, regulation, legal process, or enforceable government request;</li>
          <li>to protect the rights, safety, property, security, and integrity of FieldSolo, users, and the public; and</li>
          <li>in connection with a merger, financing, acquisition, reorganization, bankruptcy, or sale of assets, subject to this policy and applicable law.</li>
        </ul>
        <p>Our current primary service providers include Supabase for cloud database, authentication, and storage, and PostHog for optional product analytics. These providers may process information in the United States and other countries where they or their subprocessors operate.</p>

        <h2>Analytics Choices</h2>
        <p>FieldSolo uses product analytics only after you agree to analytics collection. You can withdraw analytics permission through the privacy choices described below. Withdrawal stops future analytics collection from the app and clears the app&apos;s local analytics identifier; it does not retroactively change information already processed before withdrawal.</p>

        <h2>Retention and Deletion</h2>
        <p>We retain personal information only for as long as reasonably necessary for the purposes described in this policy, including providing the Services, maintaining security, meeting legal obligations, resolving disputes, and enforcing agreements.</p>
        <p>You may ask us to remove your waitlist record or stop waitlist marketing messages at any time by emailing <a href="mailto:privacy@fieldsolo.com">privacy@fieldsolo.com</a>. Marketing emails will also include any unsubscribe mechanism required by applicable law.</p>
        <p>When you delete your account, we delete active account and User Content systems within 30 days. Encrypted backup copies are scheduled to expire within 90 days. We may retain a limited amount of information longer when necessary for legal compliance, security, fraud prevention, dispute resolution, or enforcement, and will limit that retained information to the relevant purpose.</p>

        <h2>Security</h2>
        <p>We use reasonable administrative, technical, and organizational measures designed to protect information, including access controls and encryption in transit. No system is perfectly secure; please protect your account credentials and notify us promptly of suspected unauthorized access.</p>

        <h2>Your Privacy Choices and Rights</h2>
        <p>FieldSolo honors the following requests for all users, regardless of state of residence, subject to identity verification and lawful exceptions:</p>
        <ul>
          <li>access and confirmation of personal information we process;</li>
          <li>correction of inaccurate personal information;</li>
          <li>deletion of personal information;</li>
          <li>portability of eligible information in a usable format;</li>
          <li>withdrawal of analytics consent;</li>
          <li>withdrawal of waitlist marketing consent and deletion of a waitlist record;</li>
          <li>opt-out of a sale, targeted advertising, or certain profiling, if FieldSolo ever offers those activities; and</li>
          <li>appeal of a privacy-request decision.</li>
        </ul>
        <p>To make a request or remove a waitlist record, email <a href="mailto:privacy@fieldsolo.com">privacy@fieldsolo.com</a>. To delete an app account, use the in-app Delete account control or email us. We may verify requests using information associated with your account or waitlist record. Authorized agents may submit requests by contacting us with proof of authorization. If we deny a request, you may appeal by replying to the decision or emailing privacy@fieldsolo.com with “Privacy Appeal” in the subject line.</p>

        <h2>State Privacy Notices</h2>
        <p>Depending on applicable law and FieldSolo&apos;s activities, state privacy laws may provide additional rights. This policy is our notice at collection: we collect the categories described above for the purposes described above and do not sell personal information or share it for cross-context behavioral advertising. We will not discriminate against you for exercising applicable privacy rights.</p>

        <h2>Changes to This Policy</h2>
        <p>We may update this policy as our Services or legal obligations change. We will post the updated policy and effective date. For material changes, we will provide additional notice and, where required, request renewed consent before applying the new practice.</p>

        <h2>Contact Us</h2>
        <p>For questions or privacy requests, contact:</p>
        <p><strong>Veltri Ventures LLC, operating FieldSolo</strong><br /><a href="mailto:privacy@fieldsolo.com">privacy@fieldsolo.com</a></p>
      </article>
    </main>
  );
}
