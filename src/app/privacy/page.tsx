import type { Metadata } from "next";
import Header from "@/components/Header";
import { APP_STORE_URL } from "@/lib/app-store";
import {
  APP_NAME,
  IOS_APP_NAME,
  PRO_PLAN_NAME,
  WEB_TOOL_NAME,
} from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    `Learn how privacy works across the ${IOS_APP_NAME} and the ${WEB_TOOL_NAME}, including what stays local and when a URL import is proxied.`,
};

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(27,107,99,0.18), transparent 32%), linear-gradient(180deg, #eef6f3 0%, #f4f7f4 100%)",
        lineHeight: "1.6",
      }}
    >
      <Header currentPath="/privacy" appStoreUrl={APP_STORE_URL} />

      <main
        className="mx-auto my-12 p-8"
        style={{
          width: "min(860px, calc(100% - 32px))",
          background: "rgba(255,255,255,0.88)",
          border: "1px solid rgba(22,48,43,0.1)",
          borderRadius: "28px",
          boxShadow: "0 18px 50px rgba(13,42,38,0.12)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          className="inline-block mb-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
          style={{ background: "rgba(27,107,99,0.1)", color: "#1b6b63" }}
        >
          {APP_NAME}
        </span>
        <h1
          className="font-bold mb-3"
          style={{ fontSize: "clamp(2.2rem, 4vw, 3.4rem)", color: "#16302b", lineHeight: 1.15 }}
        >
          Privacy Policy
        </h1>
        <p className="mb-4" style={{ fontSize: "1.05rem", maxWidth: "64ch", color: "#56716a" }}>
          Effective date: March 31, 2026.
        </p>
        <p style={{ color: "#56716a" }}>
          This policy covers both the {IOS_APP_NAME} and the {WEB_TOOL_NAME}.
          It explains what is processed locally, when data may pass through
          third-party services or {APP_NAME} infrastructure, and what that means
          for your privacy.
        </p>

        <div
          className="grid gap-3.5 my-7"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {[
            {
              title: IOS_APP_NAME,
              body: "In the iOS app, imported labels, previews, barcode detection, OCR, and exports are processed locally on your device.",
            },
            {
              title: WEB_TOOL_NAME,
              body: "When you upload a local file in the web tool, PDF handling and edits run in your browser on your device.",
            },
            {
              title: "URL imports",
              body: `If you import a PDF by URL in the web tool, ${APP_NAME} fetches that remote file through a server-side proxy and streams it back to the browser. The file is not intentionally stored as part of the normal flow. This is useful when hosts like Vinted serve labels from S3-backed URLs that the browser cannot fetch directly because of cross-origin rules.`,
            },
          ].map((card) => (
            <section
              key={card.title}
              className="p-4 rounded-[20px]"
              style={{
                background: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(22,48,43,0.1)",
              }}
            >
              <strong className="block mb-1.5 text-[#16302b] text-[0.95rem]">
                {card.title}
              </strong>
              <p className="text-sm" style={{ color: "#56716a" }}>{card.body}</p>
            </section>
          ))}
        </div>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          Information {APP_NAME} processes
        </h2>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>The PDF files and contents you import into the {IOS_APP_NAME} or upload directly into the {WEB_TOOL_NAME}.</li>
          <li>Recognized text and barcode data needed to detect, crop, preview, and export labels.</li>
          <li>Settings you choose, such as export format, DPI, and label preferences, which are stored locally on your device or in your browser.</li>
          <li>The remote URL you submit for web-tool URL import, and the fetched file contents needed to retrieve that document for your browser.</li>
          <li>Operational URL-import logs, including the endpoint name, event name, remote hostname, protocol, detected file extension, response content type, response byte size, and the reason for blocked or failed requests. For rate-limited requests, the log also includes the client IP address seen by the server.</li>
          <li>Purchase and entitlement status returned by Apple if you buy or restore {PRO_PLAN_NAME} in the iOS app.</li>
          <li>Information you choose to include if you contact support, report a bug, or request a feature by email.</li>
        </ul>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          How information is used
        </h2>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>To crop, optimize, preview, and export shipping labels in the iOS app and web tool.</li>
          <li>To remember your preferences between sessions on your device or in your browser.</li>
          <li>To fetch a PDF from a remote source when you choose the web tool&apos;s URL import feature.</li>
          <li>To unlock and restore paid features through Apple&apos;s billing systems in the iOS app.</li>
          <li>To respond to support requests, bug reports, or feature requests that you send by email.</li>
        </ul>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          What {APP_NAME} does not do
        </h2>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>The {IOS_APP_NAME} does not send your imported shipping labels to a {APP_NAME}-operated server for processing.</li>
          <li>The {WEB_TOOL_NAME} does not upload local-file imports to a {APP_NAME}-operated server for processing as part of normal in-browser editing.</li>
          <li>The {WEB_TOOL_NAME} URL-import feature is the exception: the remote file is proxied through a {APP_NAME}-operated server so the browser can receive it.</li>
          <li>{APP_NAME} does not require an account.</li>
          <li>{APP_NAME} does not show third-party advertising.</li>
        </ul>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          Third parties
        </h2>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>
            Apple processes in-app purchases, subscription management,
            transaction verification, and related App Store services for the
            {IOS_APP_NAME} under Apple&apos;s own policies:{" "}
            <a
              href="https://www.apple.com/legal/privacy/"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#1b6b63" }}
            >
              Apple Privacy Policy
            </a>
            .
          </li>
          <li>
            Netlify hosts the {WEB_TOOL_NAME} and may process standard hosting,
            networking, and operational logs when you use the site. Netlify
            function logs are retained for 24 hours:{" "}
            <a
              href="https://www.netlify.com/privacy/"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#1b6b63" }}
            >
              Netlify Privacy Statement
            </a>
            .
          </li>
          <li>
            If you use URL import in the web tool, the remote file host you
            specify will also receive a request for that file through {APP_NAME}&apos;s
            server-side proxy.
          </li>
          <li>
            If you use the email actions inside {APP_NAME}, your mail provider will
            also process the email you send.
          </li>
        </ul>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          Data retention
        </h2>
        <p style={{ color: "#56716a" }}>
          Imported documents and exported files remain under your control on
          your device and in locations you choose to save or share them. For
          web-tool URL imports, the requested file passes through a {APP_NAME}
          server only to fulfill that request and is not intentionally stored as
          part of the feature&apos;s normal operation. The full submitted URL, URL
          query string, and PDF contents are not intentionally written to
          application logs. URL-import function logs are retained by Netlify for
          24 hours. If you want full privacy, use a local-file import instead:
          download the PDF from Vinted first, then import it from Files or drag
          and drop. Other label platforms can have the same browser-access
          limitation, so local import is the safest option when you want
          everything to stay on your device. Support emails are retained for as
          long as reasonably necessary to respond, troubleshoot issues, and keep
          a record of product feedback.
        </p>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          Your choices
        </h2>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>You can remove app data by deleting the app and its local documents from your device.</li>
          <li>You can use local-file import instead of URL import in the web tool if you want your document handling to remain entirely in your browser. Download the PDF from Vinted first, then import it from Files or drag and drop.</li>
          <li>You can manage or cancel subscriptions through your Apple account settings.</li>
          <li>You can decide what information to include before sending an email from the app.</li>
        </ul>

        <h2
          className="font-bold mt-7 mb-3"
          style={{ fontSize: "1.15rem", color: "#16302b", lineHeight: 1.15 }}
        >
          Contact
        </h2>
        <p style={{ color: "#56716a" }}>
          For privacy questions about {APP_NAME}, contact:
        </p>
        <ul className="pl-5" style={{ color: "#56716a" }}>
          <li>Name: Umberto Ragone</li>
          <li>
            Email:{" "}
            <a href="mailto:umberto@ragone.dev" style={{ color: "#1b6b63" }}>
              umberto@ragone.dev
            </a>
          </li>
        </ul>

        <footer
          className="mt-9 pt-5 text-[0.95rem]"
          style={{
            borderTop: "1px solid rgba(22,48,43,0.1)",
            color: "#56716a",
          }}
        >
          This policy may be updated when {APP_NAME}&apos;s data practices change. The
          effective date above will be updated when a new version of this policy
          is published.
        </footer>
      </main>
    </div>
  );
}
